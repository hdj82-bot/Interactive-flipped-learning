import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AttentionPauseOverlay from "@/components/AttentionPauseOverlay";

describe("AttentionPauseOverlay", () => {
  it("renders level 1 warning message", () => {
    render(<AttentionPauseOverlay warningLevel={1} onResume={vi.fn()} />);
    expect(screen.getByText("집중해 주세요!")).toBeTruthy();
  });

  it("renders level 2 warning message", () => {
    render(<AttentionPauseOverlay warningLevel={2} onResume={vi.fn()} />);
    expect(screen.getByText("아직 보고 계신가요?")).toBeTruthy();
  });

  it("renders level 3 warning message", () => {
    render(<AttentionPauseOverlay warningLevel={3} onResume={vi.fn()} />);
    expect(screen.getByText("출석이 인정되지 않을 수 있습니다")).toBeTruthy();
  });

  it("calls onResume when button clicked", () => {
    const onResume = vi.fn();
    render(<AttentionPauseOverlay warningLevel={2} onResume={onResume} />);
    fireEvent.click(screen.getByText("영상 재개하기"));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it("calls onResume on ESC key", () => {
    const onResume = vi.fn();
    render(<AttentionPauseOverlay warningLevel={1} onResume={onResume} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onResume).toHaveBeenCalledOnce();
  });

  it("calls onResume on Enter key", () => {
    const onResume = vi.fn();
    render(<AttentionPauseOverlay warningLevel={1} onResume={onResume} />);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onResume).toHaveBeenCalledOnce();
  });

  it("has alertdialog role", () => {
    render(<AttentionPauseOverlay warningLevel={1} onResume={vi.fn()} />);
    expect(document.querySelector("[role='alertdialog']")).toBeTruthy();
  });

  it("shows warning level dots", () => {
    render(<AttentionPauseOverlay warningLevel={2} onResume={vi.fn()} />);
    const dots = document.querySelectorAll(".rounded-full.w-3");
    expect(dots.length).toBe(3);
  });
});
