"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Loader2,
  X,
  ShoppingBag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
  Users,
  UserCheck,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Tag,
  CheckSquare,
  Square,
  Sliders,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import GlobalOrderCard from "@/components/GlobalOrderCard";
import GlobalOrderDetailsModal from "@/components/GlobalOrderDetailsModal";
import {
  getCustomers,
  getCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
  updateCustomerGroupDiscount,
  assignCustomersToGroup,
  CustomerProfile,
  CustomerGroupItem,
  IGroupDiscount,
} from "@/services/customerService";
import { getOrders, Order } from "@/services/orderService";

export default function AdminCustomersPage() {
  // Tabs: 'customers' or 'groups'
  const [activeTab, setActiveTab] = useState<"customers" | "groups">("customers");

  // Customers state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Groups state
  const [groups, setGroups] = useState<CustomerGroupItem[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");

  // Selected customer IDs for group assignment
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Group modal states
  const [isAssignGroupModalOpen, setIsAssignGroupModalOpen] = useState(false);
  const [assignModalMode, setAssignModalMode] = useState<"existing" | "new" | "edit_members" | "edit_group">("existing");
  const [selectedTargetGroupId, setSelectedTargetGroupId] = useState<string>("");
  const [editingGroup, setEditingGroup] = useState<CustomerGroupItem | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("emerald");
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Modal customer search & pagination (20 per page)
  const [modalCustomerSearch, setModalCustomerSearch] = useState("");
  const [modalCustomerVisibleCount, setModalCustomerVisibleCount] = useState(20);

  // Discount modal state for a group
  const [discountModalGroup, setDiscountModalGroup] = useState<CustomerGroupItem | null>(null);
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [maxOrdersPerCustomer, setMaxOrdersPerCustomer] = useState<number>(0);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [discountActive, setDiscountActive] = useState<boolean>(true);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // Selected customer state for orders modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);
  const [loadingMoreCustomerOrders, setLoadingMoreCustomerOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);

  // Selected order state for order details modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Sorting state
  const [sortKey, setSortKey] = useState<"name" | "orderCount" | "totalExpenses">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sorting dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomers({ sortBy: sortKey, order: sortOrder });
      setCustomers(data);
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sortKey, sortOrder]);

  // Fetch Groups
  const fetchGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const grpList = await getCustomerGroups();
      setGroups(grpList);
      if (grpList.length > 0 && !selectedTargetGroupId) {
        setSelectedTargetGroupId(grpList[0]._id);
      }
    } catch (err: any) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  }, [selectedTargetGroupId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Listen to header refresh button
  useEffect(() => {
    const onRefresh = () => {
      fetchCustomers();
      fetchGroups();
    };
    window.addEventListener("admin:refresh-data", onRefresh);
    return () => window.removeEventListener("admin:refresh-data", onRefresh);
  }, [fetchCustomers, fetchGroups]);

  const fetchOrdersForCustomer = async (
    customer: CustomerProfile,
    pageNum: number,
    append: boolean = false
  ) => {
    if (append) {
      setLoadingMoreCustomerOrders(true);
    } else {
      setLoadingCustomerOrders(true);
    }

    try {
      const res = await getOrders({ userPhone: customer.phone, limit: 20, page: pageNum });
      const fetchedList = res.orders || [];
      const hasNext = res.pagination ? res.pagination.hasNextPage : fetchedList.length === 20;

      if (append) {
        setCustomerOrders((prev) => [...prev, ...fetchedList]);
      } else {
        setCustomerOrders(fetchedList);
      }

      setHasMoreOrders(hasNext);
      setOrdersPage(pageNum);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
      if (!append) setCustomerOrders([]);
    } finally {
      setLoadingCustomerOrders(false);
      setLoadingMoreCustomerOrders(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setOrdersPage(1);
    setHasMoreOrders(false);
    fetchOrdersForCustomer(customer, 1, false);
  };

  const handleScrollOrders = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (
        hasMoreOrders &&
        !loadingMoreCustomerOrders &&
        !loadingCustomerOrders &&
        selectedCustomer
      ) {
        fetchOrdersForCustomer(selectedCustomer, ordersPage + 1, true);
      }
    }
  };

  // Multi-select handlers
  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomerIds.length === filteredCustomers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map((c) => c._id));
    }
  };

  // Open modal to assign/create group
  const handleOpenAssignModal = () => {
    setAssignModalMode(groups.length > 0 ? "existing" : "new");
    setEditingGroup(null);
    setSelectedCustomerIds([]);
    setModalCustomerSearch("");
    setModalCustomerVisibleCount(20);
    setIsAssignGroupModalOpen(true);
  };

  // Open modal to manage members for an existing group
  const handleOpenManageMembers = (group: CustomerGroupItem) => {
    setEditingGroup(group);
    setSelectedTargetGroupId(group._id);
    setAssignModalMode("edit_members");
    setModalCustomerSearch("");
    setModalCustomerVisibleCount(20);
    // Extract customer IDs currently belonging to this group
    const memberIds = (group.customerIds || []).map((c: any) =>
      typeof c === "object" && c?._id ? c._id.toString() : c.toString()
    );
    setSelectedCustomerIds(memberIds);
    setIsAssignGroupModalOpen(true);
  };

  // Open modal to edit existing group details (name, description, color, members)
  const handleOpenEditGroup = (group: CustomerGroupItem) => {
    setEditingGroup(group);
    setSelectedTargetGroupId(group._id);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || "");
    setNewGroupColor(group.color || "emerald");
    const memberIds = (group.customerIds || []).map((c: any) =>
      typeof c === "object" && c?._id ? c._id.toString() : c.toString()
    );
    setSelectedCustomerIds(memberIds);
    setModalCustomerSearch("");
    setModalCustomerVisibleCount(20);
    setAssignModalMode("edit_group");
    setIsAssignGroupModalOpen(true);
  };

  // Submit assign to group
  const handleSaveAssignGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingGroup) return;
    setIsSavingGroup(true);
    try {
      if (assignModalMode === "edit_group" && editingGroup) {
        if (!newGroupName.trim()) {
          alert("Please enter a group name");
          return;
        }
        await updateCustomerGroup(editingGroup._id, {
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
          color: newGroupColor,
        });
        await assignCustomersToGroup(editingGroup._id, {
          customerIds: selectedCustomerIds,
          action: "set",
        });
      } else if (assignModalMode === "edit_members" && editingGroup) {
        await assignCustomersToGroup(editingGroup._id, {
          customerIds: selectedCustomerIds,
          action: "set",
        });
      } else if (assignModalMode === "existing") {
        if (!selectedTargetGroupId) {
          alert("Please select a group");
          return;
        }
        await assignCustomersToGroup(selectedTargetGroupId, {
          customerIds: selectedCustomerIds,
          action: "add",
        });
      } else {
        if (!newGroupName.trim()) {
          alert("Please enter a group name");
          return;
        }
        await createCustomerGroup({
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
          color: newGroupColor,
          customerIds: selectedCustomerIds,
        });
      }

      // Success
      setIsAssignGroupModalOpen(false);
      setSelectedCustomerIds([]);
      setEditingGroup(null);
      setNewGroupName("");
      setNewGroupDescription("");
      setModalCustomerSearch("");
      setModalCustomerVisibleCount(20);
      await fetchCustomers();
      await fetchGroups();
    } catch (err: any) {
      alert(err?.message || "Failed to assign group");
    } finally {
      setIsSavingGroup(false);
    }
  };

  // Open Discount modal for a group
  const handleOpenDiscountModal = (group: CustomerGroupItem) => {
    setDiscountModalGroup(group);
    setDiscountType(group.discount?.type || "percentage");
    setDiscountValue(group.discount?.value || 0);
    setMaxOrdersPerCustomer(group.discount?.maxOrdersPerCustomer || 0);
    setMinOrderAmount(group.discount?.minOrderAmount || 0);
    setDiscountActive(group.discount?.active ?? true);
  };

  // Save Discount for a group
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountModalGroup) return;
    setIsSavingDiscount(true);
    try {
      await updateCustomerGroupDiscount(discountModalGroup._id, {
        type: discountType,
        value: Number(discountValue),
        maxOrdersPerCustomer: Number(maxOrdersPerCustomer),
        minOrderAmount: Number(minOrderAmount),
        active: discountActive,
      });

      setDiscountModalGroup(null);
      await fetchGroups();
      await fetchCustomers();
    } catch (err: any) {
      alert(err?.message || "Failed to update discount");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete group "${groupName}"?`)) return;
    try {
      await deleteCustomerGroup(groupId);
      await fetchGroups();
      await fetchCustomers();
    } catch (err: any) {
      alert(err?.message || "Failed to delete group");
    }
  };

  // Filter customers by search and group
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.primaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (selectedGroupFilter !== "all") {
      const hasGroup = c.groups && c.groups.some((g) => g.id === selectedGroupFilter);
      return Boolean(hasGroup);
    }

    return true;
  });

  const getInitials = (name: string) => {
    if (!name) return "G";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Badge color helper
  const getBadgeColors = (color?: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "purple":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "amber":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "rose":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-emerald-50 text-[#0B392B] border-emerald-200";
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-4 pb-28">
        {/* Title Row */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
            Customers
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Manage customers, group segmentation, and group discounts.
          </p>
        </div>

        {/* Full-Width Tab Switcher */}
        <div className="flex items-center w-full bg-white border border-[#E8F0F2] p-1 rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "customers"
                ? "bg-[#0B392B] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Customers ({customers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "groups"
                ? "bg-[#0B392B] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Groups & Perks ({groups.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: ALL CUSTOMERS ================= */}
        {activeTab === "customers" && (
          <div className="flex flex-col gap-3">
            {/* Filter Buttons & Search Container: When search is open, displays full-width search bar; otherwise displays | All Groups | | Sort Button | | Search Icon | */}
            {isSearchOpen ? (
              <div className="relative w-full flex items-center animate-in fade-in duration-150">
                <Search className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search customers by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-white border border-[#E8F0F2] rounded-xl py-2.5 pl-10 pr-10 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B] shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  title="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  {/* Filter by Group Dropdown */}
                  {groups.length > 0 && (
                    <div className="relative shrink-0">
                      <select
                        value={selectedGroupFilter}
                        onChange={(e) => setSelectedGroupFilter(e.target.value)}
                        className="bg-white border border-[#E8F0F2] rounded-xl py-2.5 px-3 text-xs text-[#0B251C] font-bold focus:outline-none focus:border-[#0B392B] cursor-pointer shadow-2xs"
                      >
                        <option value="all">All Groups</option>
                        {groups.map((g) => (
                          <option key={g._id} value={g._id}>
                            {g.name} ({g.memberCount})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sort Dropdown Button */}
                  <div className="relative shrink-0" ref={sortRef}>
                    <button
                      type="button"
                      onClick={() => setIsSortOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 bg-white border border-[#E8F0F2] hover:border-[#0B392B]/40 px-3 py-2.5 rounded-xl text-xs font-bold text-[#0B251C] transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#0B392B]" />
                      <span className="hidden md:inline">
                        {sortKey === "name"
                          ? sortOrder === "asc"
                            ? "A - Z"
                            : "Z - A"
                          : sortKey === "orderCount"
                          ? `Orders (${sortOrder === "asc" ? "Asc" : "Desc"})`
                          : `Total spent (${sortOrder === "asc" ? "Asc" : "Desc"})`}
                      </span>
                      <span className="md:hidden">
                        {sortKey === "name"
                          ? sortOrder === "asc"
                            ? "A-Z"
                            : "Z-A"
                          : sortKey === "orderCount"
                          ? `Orders ${sortOrder === "asc" ? "↑" : "↓"}`
                          : `Spent ${sortOrder === "asc" ? "↑" : "↓"}`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                          isSortOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isSortOpen && (
                      <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-56 sm:w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-gray-100/80 mb-0.5">
                          Sort Customers By
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSortKey("name");
                            setSortOrder("asc");
                            setIsSortOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                            sortKey === "name" && sortOrder === "asc"
                              ? "bg-emerald-50 text-[#0B392B]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-extrabold text-[11px] w-6">A-Z</span>
                            <span>Name (A to Z)</span>
                          </span>
                          {sortKey === "name" && sortOrder === "asc" && (
                            <Check className="w-4 h-4 text-[#0B392B]" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSortKey("name");
                            setSortOrder("desc");
                            setIsSortOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                            sortKey === "name" && sortOrder === "desc"
                              ? "bg-emerald-50 text-[#0B392B]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-extrabold text-[11px] w-6">Z-A</span>
                            <span>Name (Z to A)</span>
                          </span>
                          {sortKey === "name" && sortOrder === "desc" && (
                            <Check className="w-4 h-4 text-[#0B392B]" />
                          )}
                        </button>

                        <div className="my-1 border-t border-gray-100/80" />

                        <button
                          type="button"
                          onClick={() => {
                            setSortKey("orderCount");
                            setSortOrder("asc");
                            setIsSortOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                            sortKey === "orderCount" && sortOrder === "asc"
                              ? "bg-emerald-50 text-[#0B392B]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ArrowUp className="w-3.5 h-3.5 text-gray-400" />
                            <span>No. of Orders (Ascending)</span>
                          </span>
                          {sortKey === "orderCount" && sortOrder === "asc" && (
                            <Check className="w-4 h-4 text-[#0B392B]" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSortKey("orderCount");
                            setSortOrder("desc");
                            setIsSortOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                            sortKey === "orderCount" && sortOrder === "desc"
                              ? "bg-emerald-50 text-[#0B392B]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
                            <span>No. of Orders (Descending)</span>
                          </span>
                          {sortKey === "orderCount" && sortOrder === "desc" && (
                            <Check className="w-4 h-4 text-[#0B392B]" />
                          )}
                        </button>

                        <div className="my-1 border-t border-gray-100/80" />

                        <button
                          type="button"
                          onClick={() => {
                            setSortKey("totalExpenses");
                            setSortOrder("asc");
                            setIsSortOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                            sortKey === "totalExpenses" && sortOrder === "asc"
                              ? "bg-emerald-50 text-[#0B392B]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ArrowUp className="w-3.5 h-3.5 text-gray-400" />
                            <span>Total spent (Ascending)</span>
                          </span>
                          {sortKey === "totalExpenses" && sortOrder === "asc" && (
                            <Check className="w-4 h-4 text-[#0B392B]" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSortKey("totalExpenses");
                            setSortOrder("desc");
                            setIsSortOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                            sortKey === "totalExpenses" && sortOrder === "desc"
                              ? "bg-emerald-50 text-[#0B392B]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
                            <span>Total spent (Descending)</span>
                          </span>
                          {sortKey === "totalExpenses" && sortOrder === "desc" && (
                            <Check className="w-4 h-4 text-[#0B392B]" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Icon Button at the whole right side */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2.5 bg-white border border-[#E8F0F2] hover:border-[#0B392B]/40 rounded-xl text-gray-600 hover:text-[#0B392B] transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                  title="Search customers"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Customer Cards Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
                <p className="text-xs text-gray-500 font-bold">Loading customers...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 text-xs font-bold text-center p-6 rounded-2xl border border-red-100 my-4">
                {error}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="bg-white text-center py-16 px-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2">
                <p className="text-sm font-bold text-gray-800">No customers found</p>
                <p className="text-xs text-gray-400">Try matching names or phone numbers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => {
                  const isRegistered = customer.customerType === "registered";
                  const avatarBg = isRegistered ? "bg-[#0B392B]" : "bg-[#D8EDFC]";
                  const avatarText = isRegistered ? "text-white" : "text-[#0B392B]";
                  const displayType = isRegistered ? "Registered" : "Guest";

                  return (
                    <div
                      key={customer._id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs hover:shadow-md hover:border-[#0B392B]/40 transition-all flex flex-col justify-between gap-3 cursor-pointer group relative"
                    >
                      {/* Profile Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-full ${avatarBg} ${avatarText} flex items-center justify-center font-bold text-sm shrink-0 shadow-inner`}
                          >
                            {getInitials(customer.primaryName)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-[#0B251C] group-hover:text-[#0B392B] transition-colors truncate">
                              {customer.primaryName}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium truncate">
                              {customer.phone}
                            </p>
                          </div>
                        </div>

                        {/* Column Wise: Status Tag on top, Group badge(s) below it */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              isRegistered
                                ? "bg-[#E6E4D5] text-[#595536]"
                                : "bg-[#DDEBF5] text-[#2C4D66]"
                            }`}
                          >
                            {displayType}
                          </span>

                          {customer.groups && customer.groups.length > 0 && (
                            <div className="flex flex-col items-end gap-1">
                              {customer.groups.map((grp) => (
                                <span
                                  key={grp.id}
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border whitespace-nowrap ${getBadgeColors(
                                    grp.color
                                  )}`}
                                >
                                  🏷️ {grp.name}
                                  {grp.discount && grp.discount.active && (
                                    <span className="ml-1 opacity-80">
                                      (
                                      {grp.discount.type === "percentage"
                                        ? `${grp.discount.value}%`
                                        : `₹${grp.discount.value}`}
                                      )
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="h-[1px] bg-gray-100 w-full" />

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 text-center divide-x divide-gray-100">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">
                            Total Orders
                          </span>
                          <span className="font-extrabold text-base text-[#0B251C]">
                            {customer.orderCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">
                            Total Spent
                          </span>
                          <span className="font-extrabold text-base text-[#0B251C]">
                            ₹{customer.totalExpenses.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: GROUPS & PERKS ================= */}
        {activeTab === "groups" && (
          <div className="flex flex-col gap-4">
            {/* Top Bar when groups exist */}
            {groups.length > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#0B251C]">Customer Groups</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {groups.length} active {groups.length === 1 ? "group" : "groups"} configured
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAssignModalMode("new");
                    setIsAssignGroupModalOpen(true);
                  }}
                  className="bg-[#0B392B] hover:bg-[#07281E] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Group</span>
                </button>
              </div>
            )}

            {/* Groups Grid / Empty State */}
            {loadingGroups ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
                <p className="text-xs text-gray-500 font-bold">Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-white text-center py-16 px-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0B392B] flex items-center justify-center">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900">No customer groups created yet</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm">
                    Create groups (e.g. Student, Regular) to segment your customers and offer special discounts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAssignModalMode("new");
                    setIsAssignGroupModalOpen(true);
                  }}
                  className="mt-2 bg-[#0B392B] hover:bg-[#07281E] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Group</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => {
                  const discount = group.discount;
                  const hasDiscount = discount && discount.value > 0;

                  return (
                    <div
                      key={group._id}
                      className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-2xs flex flex-col justify-between gap-3"
                    >
                      {/* Group Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md border ${getBadgeColors(
                                group.color
                              )}`}
                            >
                              {group.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGroupFilter(group._id);
                                setActiveTab("customers");
                              }}
                              className="text-xs font-semibold text-gray-400 hover:text-[#0B392B] hover:underline cursor-pointer transition-colors"
                              title="Click to view members of this group"
                            >
                              • {group.memberCount} {group.memberCount === 1 ? "customer" : "customers"}
                            </button>
                          </div>
                          {group.description && (
                            <p className="text-xs text-gray-500 font-medium mt-1">
                              {group.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGroup(group)}
                            className="p-1 text-gray-400 hover:text-[#0B392B] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit group"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group._id, group.name)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Discount Perk Info Card (Compact) */}
                      <div className="bg-[#F8FBFC] border border-[#E4EFF1] rounded-xl p-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Percent className="w-3 h-3 text-[#0B392B]" />
                            <span>Assigned Discount</span>
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              discount?.active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {discount?.active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {hasDiscount ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-extrabold text-[#0B251C]">
                              {discount.type === "percentage"
                                ? `${discount.value}% OFF`
                                : `Flat ₹${discount.value} OFF`}
                            </span>
                            <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-gray-600 font-medium">
                              <span>
                                Min Order Amount:{" "}
                                <strong className="text-gray-900">
                                  {discount.minOrderAmount > 0 ? `₹${discount.minOrderAmount}` : "None"}
                                </strong>
                              </span>
                              <span>
                                Max Orders:{" "}
                                <strong className="text-gray-900">
                                  {discount.maxOrdersPerCustomer > 0
                                    ? `${discount.maxOrdersPerCustomer} per customer`
                                    : "Unlimited"}
                                </strong>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">No discount configured yet.</p>
                        )}
                      </div>

                      {/* Footer Actions (Compact) */}
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleOpenManageMembers(group)}
                          className="border border-[#0B392B] text-[#0B392B] hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                        >
                          <Users className="w-3 h-3" />
                          <span>Manage Members</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDiscountModal(group)}
                          className="bg-[#0B392B] hover:bg-[#07281E] text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Configure Discount</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: ASSIGN / CREATE / EDIT GROUP ================= */}
      {isAssignGroupModalOpen && (() => {
        const filteredModalCustomers = customers.filter((c) => {
          if (!modalCustomerSearch.trim()) return true;
          const q = modalCustomerSearch.toLowerCase();
          return c.primaryName.toLowerCase().includes(q) || c.phone.includes(q);
        });
        const visibleModalCustomers = filteredModalCustomers.slice(0, modalCustomerVisibleCount);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0B392B]" />
                  <h3 className="font-extrabold text-base text-[#0B251C]">
                    {assignModalMode === "edit_group"
                      ? `Edit Group: ${editingGroup?.name || ""}`
                      : assignModalMode === "edit_members"
                      ? `Manage Members: ${editingGroup?.name || ""}`
                      : assignModalMode === "existing"
                      ? "Assign to Group"
                      : "Create Customer Group"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignGroupModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Switcher (only when creating/assigning, not when editing members or group) */}
              {assignModalMode !== "edit_members" && assignModalMode !== "edit_group" && groups.length > 0 && (
                <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setAssignModalMode("existing")}
                    className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      assignModalMode === "existing"
                        ? "bg-white text-[#0B251C] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Existing Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignModalMode("new")}
                    className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      assignModalMode === "new"
                        ? "bg-white text-[#0B251C] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Create New
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveAssignGroup} className="flex flex-col gap-3.5">
                {assignModalMode === "existing" ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Select Group</label>
                    <select
                      value={selectedTargetGroupId}
                      onChange={(e) => setSelectedTargetGroupId(e.target.value)}
                      className="w-full bg-white border border-[#E8F0F2] rounded-xl py-2.5 px-3 text-xs text-[#0F261C] font-bold focus:outline-none focus:border-[#0B392B] cursor-pointer"
                      required
                    >
                      {groups.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name} ({g.memberCount} members)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : assignModalMode === "new" || assignModalMode === "edit_group" ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700">
                        Group Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Student, Regular, Corporate"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full bg-white border border-[#E8F0F2] rounded-xl py-2.5 px-3 text-xs text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700">Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="Brief note about this group..."
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        className="w-full bg-white border border-[#E8F0F2] rounded-xl py-2.5 px-3 text-xs text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700">Badge Color Tag</label>
                      <div className="flex items-center gap-2">
                        {["emerald", "blue", "purple", "amber", "rose"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewGroupColor(c)}
                            className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                              c === "emerald"
                                ? "bg-emerald-500"
                                : c === "blue"
                                ? "bg-blue-500"
                                : c === "purple"
                                ? "bg-purple-500"
                                : c === "amber"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            } ${newGroupColor === c ? "scale-110 border-black" : "border-transparent"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Customer Selector inside the Modal with Search & Pagination */}
                <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">
                      Select Customers ({selectedCustomerIds.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCustomerIds.length === filteredModalCustomers.length) {
                          setSelectedCustomerIds([]);
                        } else {
                          setSelectedCustomerIds(filteredModalCustomers.map((c) => c._id));
                        }
                      }}
                      className="text-[11px] font-bold text-[#0B392B] hover:underline cursor-pointer"
                    >
                      {selectedCustomerIds.length === filteredModalCustomers.length && filteredModalCustomers.length > 0
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>

                  {/* Customer Search inside Modal */}
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search customers by name or mobile..."
                      value={modalCustomerSearch}
                      onChange={(e) => {
                        setModalCustomerSearch(e.target.value);
                        setModalCustomerVisibleCount(20);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                      className="w-full bg-[#F8FAFC] border border-[#E8F0F2] rounded-xl py-1.5 pl-8 pr-8 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
                    />
                    {modalCustomerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalCustomerSearch("");
                          setModalCustomerVisibleCount(20);
                        }}
                        className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Scrollable list with 20 items pagination */}
                  <div
                    onScroll={(e) => {
                      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                      if (scrollHeight - scrollTop <= clientHeight + 30) {
                        if (modalCustomerVisibleCount < filteredModalCustomers.length) {
                          setModalCustomerVisibleCount((prev) => prev + 20);
                        }
                      }
                    }}
                    className="max-h-48 overflow-y-auto no-scrollbar border border-gray-100 rounded-xl divide-y divide-gray-50 bg-[#F9FBFC] p-1"
                  >
                    {filteredModalCustomers.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400 font-medium">
                        No customers match &quot;{modalCustomerSearch}&quot;
                      </div>
                    ) : (
                      <>
                        {visibleModalCustomers.map((c) => {
                          const isChecked = selectedCustomerIds.includes(c._id);
                          return (
                            <label
                              key={c._id}
                              className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSelectCustomer(c._id)}
                                  className="w-4 h-4 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />
                                <span className="text-xs font-extrabold text-[#0B251C] truncate">
                                  {c.primaryName}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-400 font-medium shrink-0 ml-2">
                                {c.phone}
                              </span>
                            </label>
                          );
                        })}

                        {modalCustomerVisibleCount < filteredModalCustomers.length && (
                          <div className="text-center py-1.5 text-[10px] text-gray-400 font-bold bg-gray-50/50">
                            Showing {visibleModalCustomers.length} of {filteredModalCustomers.length} (scroll to load more)
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAssignGroupModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingGroup}
                    className="bg-[#0B392B] hover:bg-[#07281E] text-white px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none min-w-[110px] flex items-center justify-center gap-1.5"
                  >
                    {isSavingGroup ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {assignModalMode === "edit_group"
                            ? "Updating..."
                            : "Saving..."}
                        </span>
                      </>
                    ) : (
                      <span>
                        {assignModalMode === "edit_group"
                          ? "Update Group"
                          : assignModalMode === "edit_members"
                          ? "Save Members"
                          : "Save Group"}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: CONFIGURE GROUP DISCOUNT ================= */}
      {discountModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#0B392B]" />
                <h3 className="font-extrabold text-base text-[#0B251C]">
                  Configure Discount: {discountModalGroup.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDiscountModalGroup(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount} className="flex flex-col gap-3.5">
              {/* Discount Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Discount Type</label>
                <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      discountType === "percentage"
                        ? "bg-white text-[#0B251C] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("flat")}
                    className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      discountType === "flat"
                        ? "bg-white text-[#0B251C] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Flat Amount (₹)
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">
                  Discount Value ({discountType === "percentage" ? "%" : "₹"}){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={discountType === "percentage" ? "100" : undefined}
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full bg-white border border-[#E8F0F2] rounded-xl py-2.5 px-3 text-xs text-[#0F261C] font-bold focus:outline-none focus:border-[#0B392B]"
                  required
                />
              </div>

              {/* Min Order Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">
                  Min Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0 (no minimum required)"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  className="w-full bg-white border border-[#E8F0F2] rounded-xl py-2.5 px-3 text-xs text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
                <span className="text-[10px] text-gray-400">
                  Customers must add items worth at least this amount to apply discount.
                </span>
              </div>

              {/* No. of Orders (Max usage limit per customer) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">
                  No. of Orders (Max per customer)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (unlimited orders)"
                  value={maxOrdersPerCustomer}
                  onChange={(e) => setMaxOrdersPerCustomer(Number(e.target.value))}
                  className="w-full bg-white border border-[#E8F0F2] rounded-xl py-2.5 px-3 text-xs text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
                <span className="text-[10px] text-gray-400">
                  How many times each customer can apply this discount (0 = unlimited).
                </span>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Active Status</span>
                  <span className="text-[10px] text-gray-500">
                    Enable or disable this group discount anytime.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={discountActive}
                  onChange={(e) => setDiscountActive(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDiscountModalGroup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDiscount}
                  className="bg-[#0B392B] hover:bg-[#07281E] text-white px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingDiscount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Discount</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOMER ORDERS ================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FAF6ED] w-full max-w-2xl h-[85vh] rounded-3xl p-4 sm:p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0B392B] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {getInitials(selectedCustomer.primaryName)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0B251C]">
                    {selectedCustomer.primaryName}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Phone: {selectedCustomer.phone} • {selectedCustomer.orderCount} Orders
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders List Container */}
            <div
              onScroll={handleScrollOrders}
              className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3.5 pr-1"
            >
              {loadingCustomerOrders ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-7 h-7 animate-spin text-[#0B392B]" />
                  <span className="text-xs font-semibold">Fetching customer orders...</span>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                  <p className="text-xs font-extrabold text-gray-600">No orders found for this customer.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {customerOrders.map((ord) => (
                    <GlobalOrderCard
                      key={ord._id}
                      order={ord}
                      variant="admin"
                      onCardClick={(clickedOrd) => setSelectedOrderDetails(clickedOrd)}
                      onOrderUpdated={(updatedOrd) => {
                        if (updatedOrd) {
                          setCustomerOrders((prev) =>
                            prev.map((o) => (o._id === updatedOrd._id ? updatedOrd : o))
                          );
                        }
                      }}
                    />
                  ))}
                  {loadingMoreCustomerOrders && (
                    <div className="py-4 flex items-center justify-center gap-2 text-gray-500 text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0B392B]" />
                      <span>Loading more orders...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Order Details Modal */}
      <GlobalOrderDetailsModal
        order={selectedOrderDetails}
        variant="admin"
        onClose={() => setSelectedOrderDetails(null)}
      />

      {/* Pinned Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}
