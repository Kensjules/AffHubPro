import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Header } from "./Header";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Header", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders settings gear icon button and navigates to /settings on click", () => {
    const { container } = render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Find the settings button by aria-label
    const settingsButton = container.querySelector('button[aria-label="Settings"]') as HTMLButtonElement;
    
    expect(settingsButton).not.toBeNull();
    
    settingsButton.click();
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
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
