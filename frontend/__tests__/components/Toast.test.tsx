import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function TestToastTrigger({ message, type }: { message: string; type?: "success" | "error" | "info" | "warning" }) {
  const { toast } = useToast();
  return <button onClick={() => toast(message, type)}>Show Toast</button>;
}

describe("Toast", () => {
  it("renders toast on trigger", () => {
    render(
      <ToastProvider>
        <TestToastTrigger message="테스트 알림" />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("Show Toast").click();
    });
    expect(screen.getByText("테스트 알림")).toBeTruthy();
  });

  it("renders success toast with green color", () => {
    render(
      <ToastProvider>
        <TestToastTrigger message="성공!" type="success" />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("Show Toast").click();
    });
    const toast = screen.getByText("성공!");
    expect(toast.className).toContain("bg-green-600");
  });

  it("renders error toast with red color", () => {
    render(
      <ToastProvider>
        <TestToastTrigger message="에러!" type="error" />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("Show Toast").click();
    });
    const toast = screen.getByText("에러!");
    expect(toast.className).toContain("bg-red-600");
  });

  it("auto-dismisses toast after timeout", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <TestToastTrigger message="사라질 메시지" />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("Show Toast").click();
    });
    expect(screen.getByText("사라질 메시지")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText("사라질 메시지")).toBeNull();
    vi.useRealTimers();
  });
});
