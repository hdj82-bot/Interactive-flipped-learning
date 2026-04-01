import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginContent from "@/app/auth/login/LoginContent";

// useSearchParams mock
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    useSearchParams: () => new URLSearchParams(),
  };
});

describe("LoginContent", () => {
  it("renders login page title", () => {
    render(<LoginContent />);
    expect(screen.getByText("Interactive Flipped Learning")).toBeTruthy();
  });

  it("renders role selection buttons", () => {
    render(<LoginContent />);
    expect(screen.getByText("학습자")).toBeTruthy();
    expect(screen.getByText("교수자")).toBeTruthy();
  });

  it("defaults to student role", () => {
    render(<LoginContent />);
    const googleBtn = screen.getByText(/학습자로 Google 로그인/);
    expect(googleBtn).toBeTruthy();
  });

  it("switches to professor role on click", () => {
    render(<LoginContent />);
    fireEvent.click(screen.getByText("교수자"));
    expect(screen.getByText(/교수자로 Google 로그인/)).toBeTruthy();
  });

  it("renders Google login button", () => {
    render(<LoginContent />);
    const button = screen.getByText(/Google 로그인/);
    expect(button).toBeTruthy();
  });

  it("shows terms and privacy links", () => {
    render(<LoginContent />);
    expect(screen.getByText("이용약관")).toBeTruthy();
    expect(screen.getByText("개인정보처리방침")).toBeTruthy();
  });
});
