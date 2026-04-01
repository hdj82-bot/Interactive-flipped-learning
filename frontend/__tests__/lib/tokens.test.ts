import { describe, it, expect, beforeEach } from "vitest";
import { tokens } from "@/lib/tokens";

describe("tokens", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no tokens stored", () => {
    expect(tokens.getAccess()).toBeNull();
    expect(tokens.getRefresh()).toBeNull();
  });

  it("stores and retrieves tokens", () => {
    tokens.set("access-123", "refresh-456");
    expect(tokens.getAccess()).toBe("access-123");
    expect(tokens.getRefresh()).toBe("refresh-456");
  });

  it("clears tokens", () => {
    tokens.set("access-123", "refresh-456");
    tokens.clear();
    expect(tokens.getAccess()).toBeNull();
    expect(tokens.getRefresh()).toBeNull();
  });

  it("overwrites existing tokens", () => {
    tokens.set("old-access", "old-refresh");
    tokens.set("new-access", "new-refresh");
    expect(tokens.getAccess()).toBe("new-access");
    expect(tokens.getRefresh()).toBe("new-refresh");
  });
});
