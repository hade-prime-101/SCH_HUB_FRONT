"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MdArrowBack,
  MdPerson,
  MdEmail,
  MdPhone,
  MdNavigateNext,
  MdCheckCircle,
  MdBadge,
  MdSchool,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdDownload,
} from "react-icons/md";

import { authApi as apiClient, schoolApi } from "@/lib/api";
import { ProgressDots } from "@/components/shared/ProgressDots";
import { SearchInput } from "@/components/shared/SearchInput";
import {
  SelectionList,
  type SelectionItem,
} from "@/components/shared/SelectionList";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type {
  SchoolType,
  FacultyType,
  DepartmentType,
  RegistrationFormData,
  RegistrationStep,
} from "@/types/auth";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("school");
  const [searchQuery, setSearchQuery] = useState("");

  // Form data
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyType | null>(
    null,
  );
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentType | null>(null);

  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: "",
    email: "",
    phone: "",
    matriculation: "",
    level: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  // API data states
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [faculties, setFaculties] = useState<FacultyType[]>([]);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);

  // Loading and error states
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [departmentError, setDepartmentError] = useState<string | null>(null);

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      setLoadingSchools(true);
      setSchoolError(null);
      try {
        const data = await schoolApi.getSchools();
        setSchools(data);
      } catch (error) {
        console.error("Error fetching schools:", error);
        setSchoolError("Failed to load schools. Please refresh the page.");
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  // Fetch faculties when school is selected
  useEffect(() => {
    if (!selectedSchool) {
      setFaculties([]);
      setSelectedFaculty(null);
      setDepartments([]);
      setSelectedDepartment(null);
      return;
    }

    const fetchFaculties = async () => {
      setLoadingFaculties(true);
      setFacultyError(null);
      try {
        const data = await schoolApi.getFaculties(selectedSchool.id);
        setFaculties(data);
        setSelectedFaculty(null);
        setDepartments([]);
        setSelectedDepartment(null);
      } catch (error) {
        console.error("Error fetching faculties:", error);
        setFacultyError("Failed to load faculties. Please try again.");
      } finally {
        setLoadingFaculties(false);
      }
    };

    fetchFaculties();
  }, [selectedSchool]);

  // Fetch departments when faculty is selected
  useEffect(() => {
    if (!selectedFaculty) {
      setDepartments([]);
      setSelectedDepartment(null);
      return;
    }

    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      setDepartmentError(null);
      try {
        const data = await schoolApi.getDepartments(selectedFaculty.id);
        setDepartments(data);
        setSelectedDepartment(null);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartmentError("Failed to load departments. Please try again.");
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [selectedFaculty]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const handleContinue = () => {
    if (currentStep === "school" && selectedSchool) {
      setCurrentStep("faculty");
      setSearchQuery("");
    } else if (currentStep === "faculty" && selectedFaculty) {
      setCurrentStep("department");
      setSearchQuery("");
    } else if (currentStep === "department" && selectedDepartment) {
      setCurrentStep("details");
    }
  };

  const handleBack = () => {
    if (currentStep === "details")    setCurrentStep("department");
    else if (currentStep === "department") setCurrentStep("faculty");
    else if (currentStep === "faculty")    setCurrentStep("school");
    else if (currentStep === "school")     window.location.href = "/login";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    try {
      const res = await apiClient.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        matricNumber: formData.matriculation,
        level: formData.level,
        schoolId: selectedSchool?.id || "",
        facultyId: selectedFaculty?.id || "",
        departmentId: selectedDepartment?.id || "",
      });

      // Store tokens immediately so the user stays logged in after verification
      if (res?.tokens?.accessToken) {
        localStorage.setItem("auth_token", res.tokens.accessToken);
        localStorage.setItem("refresh_token", res.tokens.refreshToken);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        localStorage.setItem("dashboard_redirect", "mobile_app");
        // Sync to HTTP-only cookie so the splash auth check works
        await fetch("/api/auth/set-cookie", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ accessToken: res.tokens.accessToken }),
        });
      }

      window.location.href = `/verify-otp?email=${encodeURIComponent(formData.email)}&type=email-verification`;
    } catch (error: any) {
      setSubmitError(error?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (): number => {
    const steps: RegistrationStep[] = [
      "school",
      "faculty",
      "department",
      "details",
    ];
    return steps.indexOf(currentStep);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col px-4 py-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <MdArrowBack className="w-6 h-6 text-slate-900" />
        </button>
      </div>

      {/* Progress Indicator */}
      <ProgressDots currentStep={currentStep} />

      <div className="max-w-2xl w-full mx-auto flex-1">
        {/* School Selection */}
        {currentStep === "school" && (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Select Your School
            </h1>
            <p className="text-slate-600 mb-6">
              Choose the institution you're enrolled in
            </p>

            {schoolError && <ErrorMessage message={schoolError} />}

            {loadingSchools ? (
              <LoadingSkeleton />
            ) : (
              <>
                <SearchInput
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
                <SelectionList
                  items={schools.map((school) => ({
                    id: school.id,
                    name: school.name,
                    code: school.shortCode,
                    icon: <MdSchool className="w-8 h-8 text-indigo-600" />,
                  }))}
                  selectedId={selectedSchool?.id || null}
                  onSelect={(id) => {
                    const school = schools.find((s) => s.id === id);
                    setSelectedSchool(school || null);
                  }}
                  filterQuery={searchQuery}
                  isLoading={false}
                />
              </>
            )}
          </div>
        )}

        {/* Faculty Selection */}
        {currentStep === "faculty" && (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Select Your Faculty
            </h1>
            <p className="text-slate-600 mb-6">
              Choose your faculty within {selectedSchool?.shortCode}
            </p>

            {facultyError && <ErrorMessage message={facultyError} />}

            {loadingFaculties ? (
              <LoadingSkeleton />
            ) : (
              <>
                <SearchInput
                  placeholder="Search faculties..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
                <SelectionList
                  items={faculties.map((faculty) => ({
                    id: faculty.id,
                    name: faculty.name,
                    icon: <MdDownload className="w-8 h-8 text-indigo-600" />,
                  }))}
                  selectedId={selectedFaculty?.id || null}
                  onSelect={(id) => {
                    const faculty = faculties.find((f) => f.id === id);
                    setSelectedFaculty(faculty || null);
                  }}
                  filterQuery={searchQuery}
                  isLoading={false}
                />
              </>
            )}
          </div>
        )}

        {/* Department Selection */}
        {currentStep === "department" && (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Select Your Department
            </h1>
            <p className="text-slate-600 mb-6">
              Choose your department within {selectedFaculty?.name}
            </p>

            {departmentError && <ErrorMessage message={departmentError} />}

            {loadingDepartments ? (
              <LoadingSkeleton />
            ) : (
              <>
                <SearchInput
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
                <SelectionList
                  items={departments.map((dept) => ({
                    id: dept.id,
                    name: dept.name,
                    code: dept.shortCode,
                    icon: <MdBadge className="w-8 h-8 text-indigo-600" />,
                  }))}
                  selectedId={selectedDepartment?.id || null}
                  onSelect={(id) => {
                    const dept = departments.find((d) => d.id === id);
                    setSelectedDepartment(dept || null);
                  }}
                  filterQuery={searchQuery}
                  isLoading={false}
                />
              </>
            )}
          </div>
        )}

        {/* Personal Details */}
        {currentStep === "details" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Complete Your Profile
              </h1>
              <p className="text-slate-600 mb-6">
                Fill in your personal details
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  autoComplete="name"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="relative shrink-0 w-24">
                  <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    defaultValue="+234"
                    disabled
                    className="w-full pl-10 pr-2 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-semibold focus:outline-none"
                  />
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="8012345678"
                  value={formData.phone}
                  onChange={handleInputChange}
                  autoComplete="tel"
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Matriculation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Matriculation Number
              </label>
              <div className="relative">
                <MdBadge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="matriculation"
                  placeholder="CSC/2021/001"
                  value={formData.matriculation}
                  onChange={handleInputChange}
                  autoComplete="off"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Level
              </label>
              <div className="relative">
                <MdSchool className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="">Select Level</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                </select>
                <MdNavigateNext className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <MdVisibility className="w-5 h-5" />
                  ) : (
                    <MdVisibilityOff className="w-5 h-5" />
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full ${
                        index < passwordStrength
                          ? "bg-indigo-600"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <MdCheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                required
                className="w-5 h-5 rounded border-2 border-indigo-600 bg-indigo-600 accent-indigo-600 cursor-pointer mt-1"
              />
              <label className="text-sm text-slate-700">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Create Account Button */}
            {submitError && <ErrorMessage message={submitError} />}
            <button
              type="submit"
              disabled={isLoading || !formData.agreeToTerms}
              className="w-full py-3 px-4 bg-linear-to-r from-indigo-600 to-indigo-700 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-6"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>

      {/* Footer with Continue Button */}
      {currentStep !== "details" && (
        <div className="max-w-2xl w-full mx-auto mt-8">
          <button
            onClick={handleContinue}
            disabled={
              (currentStep === "school" && !selectedSchool) ||
              (currentStep === "faculty" && !selectedFaculty) ||
              (currentStep === "department" && !selectedDepartment)
            }
            className="w-full py-3 px-4 bg-linear-to-r from-indigo-600 to-indigo-700 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            Continue
          </button>
        </div>
      )}

      {/* Sign In Link */}
      {currentStep === "school" && (
        <div className="text-center mt-6">
          <p className="text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Sign In
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
