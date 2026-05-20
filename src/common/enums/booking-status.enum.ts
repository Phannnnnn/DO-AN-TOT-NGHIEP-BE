export enum BookingStatus {
  // PENDING_PAYMENT = 'pending_payment',
  PENDING = 'pending', // Đã thanh toán, chờ xác nhận
  CONFIRMED = 'confirmed', // Đã xác nhận
  COMPLETED = 'completed', // Hoàn thành
  CANCELLED = 'cancelled', // Đã hủy
}
