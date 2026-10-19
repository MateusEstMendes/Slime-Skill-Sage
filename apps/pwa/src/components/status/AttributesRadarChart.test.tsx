import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AttributesRadarChart } from "./AttributesRadarChart";
import { type AttributesMap } from "@slime-sage/game";

describe("AttributesRadarChart Component", () => {
  it("renders SVG radar chart with pentagon, axes, labels, and floating runes", () => {
    const sampleAttributes: AttributesMap = {
      INT: 250,
      FOR: 100,
      DIS: 150,
      CRI: 50,
      SOC: 80,
    };

    render(<AttributesRadarChart attributes={sampleAttributes} size={300} />);

    // SVG and Polygon exist
    expect(screen.getByTestId("radar-chart-svg")).toBeInTheDocument();
    expect(screen.getByTestId("radar-polygon")).toBeInTheDocument();

    // Floating runes container exists with Elder Futhark runes
    const runesContainer = screen.getByTestId("radar-floating-runes");
    expect(runesContainer).toBeInTheDocument();
    expect(runesContainer.textContent).toContain("ᚠ");
    expect(runesContainer.textContent).toContain("ᚢ");
    expect(runesContainer.textContent).toContain("ᛋ");

    // All 5 area labels and vertices are rendered
    expect(screen.getByTestId("radar-label-INT")).toBeInTheDocument();
    expect(screen.getByTestId("radar-label-FOR")).toBeInTheDocument();
    expect(screen.getByTestId("radar-label-DIS")).toBeInTheDocument();
    expect(screen.getByTestId("radar-label-CRI")).toBeInTheDocument();
    expect(screen.getByTestId("radar-label-SOC")).toBeInTheDocument();

    expect(screen.getByTestId("radar-vertex-INT")).toBeInTheDocument();
    expect(screen.getByTestId("radar-vertex-FOR")).toBeInTheDocument();

    // Active horizon badge is shown with dynamic ceiling (1,000 for stats < 1000)
    expect(screen.getByText(/Horizonte Vivo:/i)).toBeInTheDocument();
    expect(screen.getByTestId("radar-dynamic-ceiling").textContent).toMatch(/1[.,]000 pts/);
    expect(screen.getByText(/Aura: Inteligência Arcana/i)).toBeInTheDocument();
  });

  it("dynamically shifts dominant aura according to highest stat", () => {
    // FOR is highest
    const forDominant: AttributesMap = {
      INT: 50,
      FOR: 800,
      DIS: 100,
      CRI: 30,
      SOC: 20,
    };

    const { rerender } = render(<AttributesRadarChart attributes={forDominant} />);
    expect(screen.getByText(/Aura: Força Titânica/i)).toBeInTheDocument();

    // Now CRI becomes highest
    const criDominant: AttributesMap = {
      INT: 50,
      FOR: 100,
      DIS: 100,
      CRI: 900,
      SOC: 20,
    };

    rerender(<AttributesRadarChart attributes={criDominant} />);
    expect(screen.getByText(/Aura: Criatividade Cósmica/i)).toBeInTheDocument();
  });

  it("handles dynamic horizon expansion and retreat when ascending beyond grade thresholds", () => {
    // Stat at 950 pts (below 1,000) -> ceiling is 1,000 pts
    const nearCeiling: AttributesMap = {
      INT: 950,
      FOR: 200,
      DIS: 100,
      CRI: 50,
      SOC: 80,
    };

    const { rerender } = render(<AttributesRadarChart attributes={nearCeiling} />);
    expect(screen.getByTestId("radar-dynamic-ceiling").textContent).toMatch(/1[.,]000 pts/);

    // Stat advances to 1,050 pts (ascends to Grade II) -> ceiling steps up to 3,378 pts
    const ascended: AttributesMap = {
      INT: 1050,
      FOR: 200,
      DIS: 100,
      CRI: 50,
      SOC: 80,
    };

    rerender(<AttributesRadarChart attributes={ascended} />);
    expect(screen.getByTestId("radar-dynamic-ceiling").textContent).toMatch(/3[.,]378 pts/);
  });

  it("interactively updates tooltip and fires onSelectArea on vertex click/hover", () => {
    const onSelectMock = vi.fn();
    const sampleAttributes: AttributesMap = {
      INT: 250,
      FOR: 500,
      DIS: 150,
      CRI: 50,
      SOC: 80,
    };

    render(
      <AttributesRadarChart
        attributes={sampleAttributes}
        onSelectArea={onSelectMock}
      />
    );

    // Initial tooltip shows dominant area (FOR)
    const tooltip = screen.getByTestId("radar-tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip.textContent).toContain("FOR · Força");

    // Click on INT vertex to inspect INT
    const intVertex = screen.getByTestId("radar-vertex-INT");
    fireEvent.click(intVertex);

    expect(onSelectMock).toHaveBeenCalledWith("INT");
    expect(tooltip.textContent).toContain("INT · Inteligência");
    expect(tooltip.textContent).toContain("250 pts");

    // Hover on DIS label
    const disLabel = screen.getByTestId("radar-label-DIS");
    fireEvent.mouseEnter(disLabel);
    expect(tooltip.textContent).toContain("DIS · Disciplina");
  });
});
