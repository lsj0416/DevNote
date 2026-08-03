import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { LoginButton } from "@/components/auth/LoginButton";
import { LogoutButton } from "@/components/auth/LogoutButton";

describe("LoginButton", () => {
  it("renders a GitHub login form/button", () => {
    const html = renderToStaticMarkup(<LoginButton />);
    expect(html).toContain("GitHub로 로그인");
    expect(html).toContain("<form");
  });
});

describe("LogoutButton", () => {
  it("renders a logout form/button", () => {
    const html = renderToStaticMarkup(<LogoutButton />);
    expect(html).toContain("로그아웃");
    expect(html).toContain("<form");
  });
});
