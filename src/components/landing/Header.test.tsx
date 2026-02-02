import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Header } from "./Header";

describe("Header", () => {
  it("renders settings gear icon with correct link to /settings", () => {
    const { container } = render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Find all links and check for the settings link
    const links = container.querySelectorAll("a");
    const linksArray = Array.from(links) as HTMLAnchorElement[];
    const settingsLink = linksArray.find((link) => link.getAttribute("href") === "/settings");
    
    // Verify the settings link exists and points to /settings
    expect(settingsLink).toBeDefined();
    expect(settingsLink).not.toBeUndefined();
    if (settingsLink) {
      expect(settingsLink.getAttribute("href")).toBe("/settings");
    }
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
