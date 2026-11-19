import { StepThrough, type Step } from "../components/step-through";

/** @Cacheable product with Redis and PostgreSQL Testcontainers; DB statements counted cumulatively (study note 11.07). */
const STEPS: Step[] = [
  { step: "GET /products/{id} lần 1", detail: "DB: 1 statement (miss, một SELECT)", note: "Redis có key product::{id}, TTL = 600 giây." },
  { step: "GET lần 2", detail: "DB: vẫn 1", note: "Hit, không chạy SQL nào.", highlight: true },
  { step: "GET lần 3", detail: "DB: vẫn 1", note: "Hit." },
  { step: "PUT /products/{id} (ADMIN, giá 90)", detail: "DB: 3 (SELECT + UPDATE)", note: "@CacheEvict: key bị xoá khỏi Redis." },
  { step: "GET lần 4", detail: "DB: 4 (miss, giá mới 90.0)", note: "Nạp lại key. Giá trị lưu là JSON có \"@class\" đầy đủ: đổi tên hoặc package DTO thì cache cũ không đọc được, khi deploy đổi tên cache hoặc thêm tiền tố version." },
  { step: "Đặt đơn 2 cái khi cache đang giữ stock 10", detail: "GET trả stock 8", note: "OrderService evict cache của từng product nó trừ kho. Quên chỗ này là cache hiển thị stock cũ.", highlight: true },
];

export function CacheStepsWidget() {
  return <StepThrough steps={STEPS} />;
}
