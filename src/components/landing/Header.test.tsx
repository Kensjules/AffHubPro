import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Header } from "./Header";

describe("Header", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let hrefSetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Spy on console.log
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    // Mock window.location.href setter
    hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
    Object.defineProperty(window.location, "href", {
      set: hrefSetter,
      get: () => "",
    });
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("renders settings gear icon button and performs hard redirect on click", () => {
    const { container } = render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Find the settings button by aria-label
    const settingsButton = container.querySelector('button[aria-label="Settings"]') as HTMLButtonElement;
    
    expect(settingsButton).not.toBeNull();
    
    settingsButton.click();
    
    // Verify console.log was called
    expect(consoleLogSpy).toHaveBeenCalledWith("Redirecting to settings...");
    
    // Verify window.location.href setter was called with "/settings"
    expect(hrefSetter).toHaveBeenCalledWith("/settings");
  });

  it("renders dashboard link", () => {
    const { container } = render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    const links = container.querySelectorAll("a");
    const linksArray = Array.from(links) as HTMLAnchorElement[];
    const dashboardLink = linksArray.find((link) => link.textContent?.includes("Dashboard"));
    
    expect(dashboardLink).toBeDefined();
    expect(dashboardLink).not.toBeUndefined();
    if (dashboardLink) {
      expect(dashboardLink.getAttribute("href")).toBe("/dashboard");
    }
  });
});
