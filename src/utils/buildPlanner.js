const MAX_PROMPT_LENGTH = 4000;

export function createBuildPlan(prompt) {
  const normalized = typeof prompt === "string" ? prompt.trim() : "";
  if (!normalized) return [];

  const text = normalized.slice(0, MAX_PROMPT_LENGTH).toLowerCase();
  const tasks = [
    { id: "requirements", title: "Làm rõ yêu cầu và tiêu chí nghiệm thu", detail: "Xác định người dùng, luồng chính, phạm vi và các trạng thái lỗi." },
    { id: "structure", title: "Lập cấu trúc trang và thành phần", detail: "Đề xuất layout responsive, điều hướng và component tái sử dụng." },
    { id: "implementation", title: "Xây dựng giao diện và logic", detail: "Tạo thay đổi mã nguồn có thể rà soát; không tự ghi đè file hiện có." },
    { id: "validation", title: "Chạy kiểm tra và xử lý lỗi", detail: "Build, test và kiểm tra khả năng truy cập trước khi chấp nhận thay đổi." },
    { id: "review", title: "Rà soát thay đổi trước khi phát hành", detail: "Xem diff, xác minh cấu hình và chuẩn bị nhánh/PR; không tự deploy production." }
  ];

  if (/dashboard|analytics|biểu đồ|chart|doanh thu|kpi/.test(text)) {
    tasks.splice(2, 0, { id: "data-view", title: "Thiết kế biểu đồ và trạng thái dữ liệu", detail: "Dùng dữ liệu mẫu có nhãn rõ ràng; thêm loading, empty và error state." });
  }
  if (/form|đăng ký|đăng nhập|login|signup|contact/.test(text)) {
    tasks.splice(2, 0, { id: "form-validation", title: "Bổ sung validation và trạng thái biểu mẫu", detail: "Kiểm tra đầu vào, nhãn accessible, gửi thành công và lỗi." });
  }
  if (/api|database|cơ sở dữ liệu|postgres|sqlite|auth|authentication/.test(text)) {
    tasks.splice(tasks.length - 1, 0, { id: "integration-review", title: "Rà soát tích hợp và quyền truy cập", detail: "Xác định hợp đồng API, xác thực và biến môi trường; không đưa secrets vào mã nguồn." });
  }

  return tasks;
}
