import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders without label", () => {
    render(<LoadingSpinner />);
    const svg = document.querySelector("svg.animate-spin");
    expect(svg).toBeTruthy();
  });

  it("renders with label", () => {
    render(<LoadingSpinner label="로딩 중..." />);
    expect(screen.getByText("로딩 중...")).toBeTruthy();
  });

  it("renders small size", () => {
    render(<LoadingSpinner size="sm" />);
    const svg = document.querySelector("svg.animate-spin");
    expect(svg?.classList.contains("h-4")).toBe(true);
  });

  it("renders large size", () => {
    render(<LoadingSpinner size="lg" />);
    const svg = document.querySelector("svg.animate-spin");
    expect(svg?.classList.contains("h-12")).toBe(true);
  });

  it("renders fullScreen mode", () => {
    render(<LoadingSpinner fullScreen />);
    const wrapper = document.querySelector(".min-h-screen");
    expect(wrapper).toBeTruthy();
  });
});
