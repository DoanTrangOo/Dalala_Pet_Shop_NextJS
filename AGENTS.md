 # AI Agent Coding Guidelines
    2
    3 File này chứa các nguyên tắc bắt buộc AI phải tuân thủ khi hỗ trợ lập trình trong dự án này.
    4
    5 ## 1. Suy nghĩ trước khi Code (Think Before Coding)
    6 - **Không tự ý giả định:** Nếu yêu cầu của người dùng mơ hồ, phải đặt câu hỏi làm rõ thay vì tự đoán.
    7 - **Phân tích lựa chọn:** Trước khi viết code, hãy nêu ra các hướng giải quyết (Trade-offs) và tại sao chọn hướng
      đó.
    8 - **Dừng lại khi nhầm lẫn:** Nếu phát hiện sự mâu thuẫn trong logic hoặc codebase, phải báo cáo ngay cho người
      dùng thay vì cố gắng sửa chữa mù quáng.
    9
   10 ## 2. Ưu tiên sự đơn giản (Simplicity First)
   11 - **Code tối thiểu:** Chỉ viết lượng code ít nhất có thể để giải quyết vấn đề.
   12 - **Không "để dành":** Không thêm các tính năng, cấu trúc, hay tính linh hoạt (abstraction) nếu người dùng chưa
      yêu cầu trực tiếp.
   13 - **Nếu 100 dòng có thể rút gọn thành 20 dòng, hãy làm điều đó.**
   14 - **Tránh Over-engineering:** Ưu tiên giải pháp dễ đọc, dễ bảo trì hơn là giải pháp phức tạp "thông minh".
   15
   16 ## 3. Thay đổi mang tính "Phẫu thuật" (Surgical Changes)
   17 - **Phạm vi hẹp:** Chỉ chỉnh sửa những dòng code liên quan trực tiếp đến yêu cầu.
   18 - **Tôn trọng code cũ:** Không tự ý định dạng lại (reformat), không thay đổi comment hoặc logic của những phần
      không liên quan.
   19 - **Nhất quán:** Tuân thủ đúng phong cách viết code hiện tại của file (naming convention, tab/space, brackets...).
   20 - **Dọn dẹp có trách nhiệm:** Chỉ xóa các biến/import dư thừa do chính thay đổi của AI tạo ra. Không xóa code rác
      có sẵn trừ khi được yêu cầu.
   21
   22 ## 4. Thực thi theo mục tiêu (Goal-Driven)
   23 - **Tiêu chí thành công:** Chuyển các yêu cầu mơ hồ thành mục tiêu có thể kiểm chứng (Ví dụ: "Viết test case, sau
      đó làm cho nó pass").
   24 - **Quy trình Plan-Act-Verify:**
   25   1. Lập kế hoạch ngắn gọn.
   26   2. Thực hiện thay đổi.
   27   3. Xác nhận kết quả (bằng test hoặc chạy thử).
   28 - **Lặp lại cho đến khi hoàn tất:** AI phải tự kiểm tra lại code của mình trước khi bàn giao.
   29
   30 ---
   31 *Lưu ý cho AI: Hãy đọc kỹ file này trước khi thực hiện bất kỳ thay đổi nào vào codebase.*