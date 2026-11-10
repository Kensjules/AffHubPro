import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePaymentConfirmation } from "./usePaymentConfirmation";

const { invoke, getSession } = vi.hoisted(() => ({ invoke: vi.fn(), getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession }, functions: { invoke } } }));

describe("payment verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getSession.mockResolvedValue({ data: { session: { access_token: "test-token" } } });
    invoke.mockReset();
    invoke.mockResolvedValue({ data: { subscribed: false }, error: null });
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it("does not confirm merely on arrival or a negative subscription result", async () => {
    const { result } = renderHook(usePaymentConfirmation);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current).toBe("confirming");
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("retries every 3 seconds and confirms only a verified subscription", async () => {
    const { result } = renderHook(usePaymentConfirmation);
    await act(async () => { await vi.advanceTimersByTimeAsync(2999); });
    expect(invoke).toHaveBeenCalledTimes(1);
    invoke.mockResolvedValue({ data: { subscribed: true }, error: null });
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(result.current).toBe("confirmed");
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(result.current).toBe("confirmed");
  });

  it("stops after 30 seconds without confirming failed requests", async () => {
    invoke.mockResolvedValue({ data: { subscribed: true }, error: new Error("failed") });
    const { result } = renderHook(usePaymentConfirmation);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(result.current).toBe("pending");
    const calls = invoke.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(invoke).toHaveBeenCalledTimes(calls);
  });

  it("does not confirm a request that completes after the timeout", async () => {
    let resolve: ((value: unknown) => void) | undefined;
    invoke.mockImplementation(() => new Promise(r => { resolve = r; }));
    const { result } = renderHook(usePaymentConfirmation);
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    await act(async () => { resolve?.({ data: { subscribed: true }, error: null }); });
    expect(result.current).toBe("pending");
  });
});