import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the JobsRadar placeholder screen (Fase 1)", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "JobsRadar" })).toBeInTheDocument();
  });
});
