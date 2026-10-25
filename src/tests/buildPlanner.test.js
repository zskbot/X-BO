import { describe, expect, it } from "vitest";
import { createBuildPlan } from "../utils/buildPlanner.js";

describe("createBuildPlan", () => {
  it("returns no tasks for an empty prompt", () => {
    expect(createBuildPlan("   ")).toEqual([]);
  });

  it("returns a reviewable baseline plan for a normal prompt", () => {
    const plan = createBuildPlan("Tạo trang giới thiệu sản phẩm");
    expect(plan.map(task => task.id)).toEqual([
      "requirements", "structure", "implementation", "validation", "review"
    ]);
    expect(plan.every(task => task.title && task.detail)).toBe(true);
  });

  it("adds dashboard-specific data tasks", () => {
    expect(createBuildPlan("Tạo dashboard doanh thu với KPI").some(task => task.id === "data-view")).toBe(true);
  });

  it("adds form validation tasks", () => {
    expect(createBuildPlan("Tạo contact form").some(task => task.id === "form-validation")).toBe(true);
  });

  it("adds integration review for API/database requests", () => {
    expect(createBuildPlan("Tạo app dùng API và PostgreSQL").some(task => task.id === "integration-review")).toBe(true);
  });

  it("bounds prompt processing for oversized input", () => {
    expect(createBuildPlan("a".repeat(10000)).length).toBeGreaterThan(0);
  });
});
