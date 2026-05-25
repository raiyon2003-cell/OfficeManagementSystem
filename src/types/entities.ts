import type { AppStatus } from "@/types";

export interface Visitor {
  id: string;
  fullName: string;
  email?: string | null;
  phone: string;
  company?: string | null;
  purpose: string;
  idType?: string | null;
  idNumber?: string | null;
  vehicleNumber?: string | null;
  photoUrl?: string | null;
  scheduledDate: string;
  scheduledTime?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  hostId: string;
  host?: { id: string; firstName: string; lastName: string; email: string };
  status: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  badgeNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorLog {
  id: string;
  visitorId: string;
  action: string;
  performedById?: string | null;
  performedBy?: { firstName: string; lastName: string } | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  status: string;
  location: string;
  floor?: string | null;
  building?: string | null;
  description?: string | null;
  equipment?: RoomEquipment[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomEquipment {
  id: string;
  roomId: string;
  name: string;
  quantity: number;
  status: string;
}

export interface RoomBooking {
  id: string;
  title: string;
  organizerId: string;
  organizer?: { firstName: string; lastName: string; email: string };
  roomId: string;
  room?: MeetingRoom;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  attendeeEmails: string[];
  status: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string | null;
  type: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: InventoryCategory;
  vendorId?: string | null;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number | null;
  reorderLevel: number;
  unitPrice: number | string;
  location?: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  reason?: string | null;
  performedById: string;
  performedBy?: { firstName: string; lastName: string };
  reference?: string | null;
  createdAt: string;
}

export interface StationeryItem {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  reorderLevel: number;
  unitPrice: number | string;
  location?: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StationeryIssuance {
  id: string;
  itemId: string;
  item?: StationeryItem;
  employeeId: string;
  employee?: { firstName: string; lastName: string };
  quantity: number;
  issuedById: string;
  purpose?: string | null;
  createdAt: string;
}

export interface DocumentInventory {
  id: string;
  name: string;
  type: string;
  currentStock: number;
  minStockLevel: number;
  location?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReprintRequest {
  id: string;
  documentId: string;
  document?: DocumentInventory;
  quantity: number;
  purpose: string;
  status: AppStatus | string;
  requestedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
  categoryId?: string | null;
  category?: { id: string; name: string };
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequestItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
}

export interface PurchaseRequest {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  requestedById: string;
  requestedBy?: { firstName: string; lastName: string; email: string };
  vendorId?: string | null;
  vendor?: Vendor;
  totalAmount: number | string;
  items: PurchaseRequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OfficeExpense {
  id: string;
  title: string;
  amount: number | string;
  category: string;
  expenseDate: string;
  description?: string | null;
  createdById: string;
  createdAt: string;
}

export interface DashboardOverview {
  visitorsToday: number;
  upcomingMeetings: number;
  roomOccupancyPercent: number;
  lowStockCount: number;
  pendingApprovals: number;
  expensesByMonth: { month: string; amount: number }[];
  visitorsByDay: { date: string; count: number }[];
  recentActivities: {
    id: string;
    action: string;
    module: string;
    userName?: string;
    createdAt: string;
  }[];
  upcomingMeetingsList: RoomBooking[];
  lowStockItems: (InventoryItem | StationeryItem)[];
}

export interface ReportDefinition {
  id: string;
  type: string;
  status: string;
  fileUrl?: string | null;
  createdAt: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  roomId?: string;
  date?: string;
}
