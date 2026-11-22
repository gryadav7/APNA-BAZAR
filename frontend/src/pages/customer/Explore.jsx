import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaFilter,
  FaSortAmountDown,
  FaTimes,
  FaStore,
  FaInfoCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaArrowRight
} from "react-icons/fa";
import {
  COLORS,
  SHADOWS,
  RADIUS,
  PAGE_WIDTH,
  TYPOGRAPHY
} from "../../components/designSystem";
import useResponsive from "../../hooks/useResponsive";
import businessService from "../../services/businessService";
import BusinessCard from "../../components/BusinessCard";
import Button from "../../components/Button";
import Loader from "../../components/Loader";

const CATEGORIES_LIST = [
  "Salon & Beauty",
  "Healthcare",
  "Fitness & Gym",
  "Restaurants & Cafes",
  "Home Services",
  "Automobile Care",
  "Education & Classes",
  "Professional"
];

const ITEMS_PER_PAGE = 8;

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;

  // Read URL search params directly
  const queryParam = searchParams.get("query") || "";
  const categoryParam = searchParams.get("category") || "";
  const cityParam = searchParams.get("city") || "";
  const sortParam = searchParams.get("sort") || "latest";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Filter Form State initialized from URL
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [cityTerm, setCityTerm] = useState(cityParam);
  const [sortBy, setSortBy] = useState(sortParam);

  // Business Data State
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES_LIST);
  const [loading, setLoading] = useState(true);
  const [backendBlocker, setBackendBlocker] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch registered categories from backend
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const res = await businessService.getCategories();
        if (isMounted && Array.isArray(res?.categories)) {
          const combined = Array.from(new Set([...CATEGORIES_LIST, ...res.categories])).filter(Boolean);
          setCategories(combined);
        }
      } catch {
        // Fallback to CATEGORIES_LIST
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real businesses when query params change
  useEffect(() => {
    let isMounted = true;

    async function loadBusinesses() {
      try {
        const params = {};
        if (queryParam) params.search = queryParam;
        if (categoryParam) params.category = categoryParam;
        if (cityParam) params.city = cityParam;
        if (sortParam) params.sort = sortParam;

        const data = await businessService.getBusinesses(params);

        if (isMounted) {
          const list = Array.isArray(data?.businesses)
            ? data.businesses
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
            ? data
            : [];

          setBusinesses(list);
          setBackendBlocker(false);
          setErrorMessage("");
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404 || !err.status) {
            setBackendBlocker(true);
          } else {
            setErrorMessage(
              err.customMessage ||
                err.message ||
                "Unable to fetch businesses from server"
            );
          }
          setBusinesses([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBusinesses();

    return () => {
      isMounted = false;
    };
  }, [queryParam, categoryParam, cityParam, sortParam]);

  // Client-side sorting logic to guarantee responsive sorting on returned records
  const sortedBusinesses = useMemo(() => {
    const list = [...businesses];

    switch (sortBy) {
      case "rating":
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "name_asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case "latest":
      default:
        return list.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
    }
  }, [businesses, sortBy]);

  // Pagination calculations
  const totalItems = sortedBusinesses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validPage = Math.min(Math.max(1, pageParam), totalPages);

  const paginatedBusinesses = useMemo(() => {
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    return sortedBusinesses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedBusinesses, validPage]);

  // Apply filters to URL
  function applyFilters(newOverrides = {}) {
    const params = new URLSearchParams();

    const q = newOverrides.query !== undefined ? newOverrides.query : searchTerm;
    const cat =
      newOverrides.category !== undefined ? newOverrides.category : selectedCategory;
    const c = newOverrides.city !== undefined ? newOverrides.city : cityTerm;
    const s = newOverrides.sort !== undefined ? newOverrides.sort : sortBy;
    const p = newOverrides.page !== undefined ? newOverrides.page : 1;

    if (q.trim()) params.set("query", q.trim());
    if (cat) params.set("category", cat);
    if (c.trim()) params.set("city", c.trim());
    if (s && s !== "latest") params.set("sort", s);
    if (p > 1) params.set("page", p.toString());

    setLoading(true);
    setSearchParams(params);
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    applyFilters({ page: 1 });
  }

  function handleSortChange(e) {
    const newSort = e.target.value;
    setSortBy(newSort);
    applyFilters({ sort: newSort, page: 1 });
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    applyFilters({ page: newPage });
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  function clearAllFilters() {
    setSearchTerm("");
    setSelectedCategory("");
    setCityTerm("");
    setSortBy("latest");
    setLoading(true);
    setSearchParams({});
  }

  const hasActiveFilters = Boolean(
    queryParam || categoryParam || cityParam || (sortParam && sortParam !== "latest")
  );

  return (
    <div
      style={{
        maxWidth: PAGE_WIDTH,
        margin: "0 auto",
        padding: isMobile ? "24px 16px 64px" : "40px 28px 80px",
        boxSizing: "border-box"
      }}
    >
      {/* Header & Page Title */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.secondary,
            margin: "0 0 8px",
            fontSize: isMobile ? "28px" : "36px"
          }}
        >
          Explore Businesses
        </h1>
        <p style={{ ...TYPOGRAPHY.body, color: COLORS.muted, margin: 0 }}>
          Find trusted local businesses, compare service prices, and book direct appointments.
        </p>
      </div>

      {/* Filter and Search Bar Card */}
      <form
        onSubmit={handleFilterSubmit}
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.large,
          boxShadow: SHADOWS.card,
          padding: isMobile ? "18px 16px" : "22px 24px",
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
            ? "1fr 1fr"
            : "2fr 1.5fr 1.5fr auto auto",
          gap: "12px",
          alignItems: "center",
          marginBottom: "24px"
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "11px 14px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.small,
            background: COLORS.surfaceSubtle
          }}
        >
          <FaSearch color={COLORS.primary} size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search business or service..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: "14px",
              fontFamily: "inherit",
              color: COLORS.text
            }}
          />
        </div>

        {/* City Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "11px 14px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.small,
            background: COLORS.surfaceSubtle
          }}
        >
          <FaMapMarkerAlt color={COLORS.primary} size={14} />
          <input
            type="text"
            value={cityTerm}
            onChange={(e) => setCityTerm(e.target.value)}
            placeholder="Location or City..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: "14px",
              fontFamily: "inherit",
              color: COLORS.text
            }}
          />
        </div>

        {/* Category Select */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "11px 14px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.small,
            background: COLORS.surfaceSubtle
          }}
        >
          <FaFilter color={COLORS.primary} size={13} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: "14px",
              fontFamily: "inherit",
              color: COLORS.text,
              cursor: "pointer"
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Search Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          icon={<FaSearch />}
        >
          Apply Filters
        </Button>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={clearAllFilters}
          >
            Reset
          </Button>
        )}
      </form>

      {/* Sub-bar: Active Chips & Sort Selector */}
      <div
        style={{
          display: "flex",
          flexDirection: isCompact ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isCompact ? "flex-start" : "center",
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        {/* Active Filter Chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: "600", color: COLORS.secondary }}>
            {!loading && `${totalItems} ${totalItems === 1 ? "Business" : "Businesses"} found`}
          </span>

          {queryParam && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: COLORS.primaryBg,
                color: COLORS.primaryDark,
                padding: "4px 10px",
                borderRadius: RADIUS.pill,
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              Search: "{queryParam}"
              <FaTimes
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSearchTerm("");
                  applyFilters({ query: "" });
                }}
              />
            </span>
          )}

          {categoryParam && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: COLORS.primaryBg,
                color: COLORS.primaryDark,
                padding: "4px 10px",
                borderRadius: RADIUS.pill,
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              Category: {categoryParam}
              <FaTimes
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedCategory("");
                  applyFilters({ category: "" });
                }}
              />
            </span>
          )}

          {cityParam && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: COLORS.primaryBg,
                color: COLORS.primaryDark,
                padding: "4px 10px",
                borderRadius: RADIUS.pill,
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              City: {cityParam}
              <FaTimes
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setCityTerm("");
                  applyFilters({ city: "" });
                }}
              />
            </span>
          )}
        </div>

        {/* Sort Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaSortAmountDown color={COLORS.muted} size={13} />
          <span style={{ fontSize: "13px", color: COLORS.muted }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={handleSortChange}
            style={{
              padding: "7px 12px",
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.small,
              fontSize: "13px",
              color: COLORS.secondary,
              fontFamily: "inherit",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="latest">Newest Registered</option>
            <option value="rating">Highest Rated</option>
            <option value="name_asc">Name (A to Z)</option>
            <option value="name_desc">Name (Z to A)</option>
          </select>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. LOADING STATE */}
      {/* ============================================================== */}
      {loading && (
        <div
          style={{
            minHeight: "340px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          <Loader size={44} text="Querying registered businesses from database..." />
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. REAL BUSINESS LISTING RESULTS */}
      {/* ============================================================== */}
      {!loading && paginatedBusinesses.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                ? "1fr 1fr"
                : "repeat(4, 1fr)",
              gap: "24px",
              marginBottom: "40px"
            }}
          >
            {paginatedBusinesses.map((biz) => (
              <BusinessCard key={biz._id} business={biz} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginTop: "32px",
                paddingTop: "24px",
                borderTop: `1px solid ${COLORS.border}`
              }}
            >
              <Button
                variant="outline"
                size="sm"
                icon={<FaArrowLeft />}
                disabled={validPage <= 1}
                onClick={() => handlePageChange(validPage - 1)}
              >
                Previous
              </Button>

              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: COLORS.secondary,
                  padding: "0 8px"
                }}
              >
                Page {validPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                icon={<FaArrowRight />}
                iconPosition="right"
                disabled={validPage >= totalPages}
                onClick={() => handlePageChange(validPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 3. EMPTY STATE (DATABASE CONTAINS 0 MATCHING RESULTS) */}
      {/* ============================================================== */}
      {!loading && !backendBlocker && businesses.length === 0 && (
        <div
          style={{
            background: COLORS.surface,
            border: `1px dashed ${COLORS.borderDark}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "44px 20px" : "64px 32px",
            textAlign: "center",
            maxWidth: "600px",
            margin: "20px auto 0"
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: RADIUS.round,
              background: COLORS.lightPurple,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              margin: "0 auto 18px"
            }}
          >
            <FaStore />
          </div>

          <h3
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: COLORS.secondary,
              margin: "0 0 10px"
            }}
          >
            No Businesses Found
          </h3>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.muted,
              lineHeight: "1.6",
              margin: "0 0 24px"
            }}
          >
            {hasActiveFilters
              ? "We couldn't find any registered businesses matching your specific filter criteria. Try clearing some filters or searching a different city."
              : "There are currently no registered businesses in the database. Be the first local merchant to create an account and list your services!"}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center"
            }}
          >
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => navigate("/register")}
                icon={<FaStore />}
              >
                Register Your Business
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. BACKEND BLOCKER / API NOTICE (STRICT REAL DATA COMPLIANCE) */}
      {/* ============================================================== */}
      {!loading && backendBlocker && (
        <div
          style={{
            background: COLORS.surface,
            border: `1px dashed ${COLORS.warningBorder}`,
            borderRadius: RADIUS.large,
            boxShadow: SHADOWS.card,
            padding: isMobile ? "44px 20px" : "64px 32px",
            textAlign: "center",
            maxWidth: "680px",
            margin: "20px auto 0"
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: RADIUS.round,
              background: COLORS.warningBg,
              color: COLORS.warning,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              margin: "0 auto 18px"
            }}
          >
            <FaExclamationTriangle />
          </div>

          <h3
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: COLORS.secondary,
              margin: "0 0 10px"
            }}
          >
            Public Business Endpoint Awaiting Backend Mounting
          </h3>

          <p
            style={{
              fontSize: "14px",
              color: COLORS.muted,
              lineHeight: "1.6",
              margin: "0 0 20px"
            }}
          >
            The public business listing route (<code>GET /api/business</code>) is required to
            serve real MongoDB business records with search and filter capabilities. Under
            APNA-BAZAR strict real-data rules, no dummy businesses are simulated.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: COLORS.infoBg,
              color: "#1E40AF",
              border: `1px solid ${COLORS.infoBorder}`,
              padding: "10px 16px",
              borderRadius: RADIUS.small,
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "24px"
            }}
          >
            <FaInfoCircle />
            <span>Real Data Only: Live database connection required</span>
          </div>

          <div>
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true);
                setSearchParams(new URLSearchParams(searchParams));
              }}
              icon={<FaSearch />}
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {errorMessage && !backendBlocker && (
        <div
          style={{
            background: COLORS.dangerBg,
            border: `1px solid ${COLORS.dangerBorder}`,
            borderRadius: RADIUS.small,
            padding: "14px 18px",
            color: COLORS.danger,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "20px"
          }}
        >
          <FaExclamationTriangle />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

export default Explore;
