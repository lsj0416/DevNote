// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalysisRequestForm } from "@/components/analysis/AnalysisRequestForm";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AnalysisRequestForm />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  refreshMock.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AnalysisRequestForm", () => {
  it("renders repo URL and branch inputs with a submit button", () => {
    renderForm();

    expect(screen.getByPlaceholderText("https://github.com/owner/repo")).toBeTruthy();
    expect(screen.getByPlaceholderText("main")).toBeTruthy();
    expect(screen.getByRole("button", { name: "분석 요청" })).toBeTruthy();
  });

  it("submits the form and starts polling on success", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/analysis")) {
        return jsonResponse(202, {
          success: true,
          message: "OK",
          data: { jobId: "job-1", status: "PENDING", repoUrl: "https://github.com/a/b", branch: "" },
        });
      }
      return jsonResponse(200, {
        success: true,
        message: "OK",
        data: { jobId: "job-1", status: "PROCESSING", repoUrl: "https://github.com/a/b", branch: "" },
      });
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText("https://github.com/owner/repo"), "https://github.com/a/b");
    await user.click(screen.getByRole("button", { name: "분석 요청" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("분석 중")).toBeTruthy());
  });

  it("shows the server error message on a 400 response", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      jsonResponse(400, { success: false, message: "유효한 GitHub repo URL이 아닙니다.", code: "INVALID_REQUEST" })
    );

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText("https://github.com/owner/repo"), "not-a-url");
    await user.click(screen.getByRole("button", { name: "분석 요청" }));

    await waitFor(() =>
      expect(screen.getByText("유효한 GitHub repo URL이 아닙니다.")).toBeTruthy()
    );
  });

  it("shows a duplicate-request message on a 409 response", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        success: false,
        message: "이미 진행 중인 분석 요청이 있습니다.",
        code: "DUPLICATE_REQUEST",
      })
    );

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText("https://github.com/owner/repo"), "https://github.com/a/b");
    await user.click(screen.getByRole("button", { name: "분석 요청" }));

    await waitFor(() =>
      expect(screen.getByText("이미 진행 중인 동일 repo 분석 요청이 있습니다.")).toBeTruthy()
    );
  });
});
