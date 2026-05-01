import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import App from "@/App";

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("App", () => {
  it("renders the wordmark", () => {
    renderWithClient(<App />);
    expect(screen.getByLabelText("tu.tradeas")).toBeInTheDocument();
  });

  it("renders all four panel headings", () => {
    renderWithClient(<App />);
    expect(screen.getByRole("heading", { name: "scratchpad" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "perp positions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "spot portfolio" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "allocation" })).toBeInTheDocument();
  });

  it("renders the settings gear button", () => {
    renderWithClient(<App />);
    expect(screen.getByRole("button", { name: "open settings" })).toBeInTheDocument();
  });
});
