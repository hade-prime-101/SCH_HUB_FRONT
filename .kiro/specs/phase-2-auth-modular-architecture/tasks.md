# Phase 2: Authentication & Modular Architecture - Implementation Tasks

## Task Waves

### Wave 1: Setup and Types (Day 1)

- [x] 1.1 Create folder structure
  - [x] Create `/lib/hooks/` directory
  - [x] Create `/lib/validators/` directory
  - [x] Create `/lib/storage/` directory
  - [x] Create `/lib/hooks/__tests__/` directory
  - [x] Create `/lib/validators/__tests__/` directory
  - [x] Create `/lib/storage/__tests__/` directory
  - **Acceptance:** All folders created

- [x] 1.2 Extend auth types
  - [x] File: `/types/auth.ts`
  - [x] Add `AuthResponse { user, token, refreshToken }`
  - [x] Add `User { id, email, roles, school?, faculty?, department? }`
  - [x] Add `LoginCredentials { email, password }`
  - [x] Add `FormErrors { [field]: string }`
  - [x] Add `ValidationResult { valid, error? }`
  - **Acceptance:** All types defined and exported

---

### Wave 2: Hooks Implementation (Days 2-3)

- [x] 2.1 Implement useAuth hook
  - [x] File: `/lib/hooks/useAuth.ts`
  - [x] Returns: `{ user, loading, error, isAuthenticated, login, logout, checkAuth }`
  - [x] Manage auth state
  - [x] Restore session on mount
  - [x] Handle token refresh
  - **Acceptance:** Hook works, session persists

- [x] 2.2 Implement useForm hook
  - [x] File: `/lib/hooks/useForm.ts`
  - [x] Returns: `{ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }`
  - [x] Manage form state
  - [x] Validate on blur
  - [x] Call onSubmit
  - **Acceptance:** Form state works, validation on blur

- [x] 2.3 Implement useAsync hook
  - [x] File: `/lib/hooks/useAsync.ts`
  - [x] Returns: `{ data, loading, error, execute }`
  - [x] Execute async function
  - [x] Update state
  - [x] Cleanup on unmount
  - **Acceptance:** Async state works, no memory leaks

- [x] 2.4 Implement useLocalStorage hook
  - [x] File: `/lib/hooks/useLocalStorage.ts`
  - [x] Returns: `[value, setValue]`
  - [x] Persist to localStorage
  - [ ] Handle JSON serialization
  - **Acceptance:** Values persist across reload

- [x] 2.5 Create hooks index
  - [x] File: `/lib/hooks/index.ts`
  - [x] Export all hooks
  - **Acceptance:** All hooks exported

---

### Wave 3: Validators Implementation (Days 2-3)

- [x] 3.1 Implement email validator
  - [ ] File: `/lib/validators/email.ts`
  - [ ] Function: `validateEmail(email): ValidationResult`
  - [ ] Use RFC 5322 compatible regexw
  - [ ] Return clear error messages
  - **Acceptance:** Valid/invalid emails detected

- [ ] 3.2 Implement password validator
  - [ ] File: `/lib/validators/password.ts`
  - [ ] Function: `validatePassword(password): ValidationResult`
  - [ ] Check: min 8 chars, 1 uppercase, 1 number, 1 special
  - [ ] Return list of failures
  - [ ] Calculate strength (weak/fair/good/strong)
  - **Acceptance:** Password requirements enforced

- [ ] 3.3 Implement form validator
  - [ ] File: `/lib/validators/form.ts`
  - [ ] Function: `validateForm(values, schema): errors`
  - [ ] Compose validators
  - [ ] Return all errors
  - **Acceptance:** Multiple field validation works

- [ ] 3.4 Implement field validators
  - [ ] File: `/lib/validators/fields.ts`
  - [ ] Functions: `validateRequired`, `validateMinLength`, `validatePattern`
  - [ ] Build block validators
  - **Acceptance:** Field validators reusable

- [ ] 3.5 Create validators index
  - [ ] File: `/lib/validators/index.ts`
  - [ ] Export all validators
  - **Acceptance:** All validators exported

---

### Wave 4: Storage Implementation (Day 3)

- [ ] 4.1 Implement localStorage manager
  - [ ] File: `/lib/storage/localStorage.ts`
  - [ ] Functions: `getItem<T>`, `setItem<T>`, `removeItem`, `clear`
  - [ ] Handle JSON serialization
  - [ ] Handle quota exceeded
  - **Acceptance:** Type-safe storage works

- [ ] 4.2 Implement sessionStorage manager
  - [ ] File: `/lib/storage/sessionStorage.ts`
  - [ ] Same interface as localStorage
  - **Acceptance:** Session storage works

- [ ] 4.3 Implement cookie manager
  - [ ] File: `/lib/storage/cookies.ts`
  - [ ] Functions: `getCookie`, `setCookie`, `deleteCookie`
  - [ ] Support options: maxAge, secure, httpOnly, sameSite
  - **Acceptance:** Cookies managed securely

- [ ] 4.4 Create storage index
  - [ ] File: `/lib/storage/index.ts`
  - [ ] Export all managers
  - **Acceptance:** All storage managers exported

---

### Wave 5: API Client Extensions (Day 4)

- [ ] 5.1 Extend API client with auth methods
  - [ ] File: `/lib/api-client.ts`
  - [ ] Add `login(email, password)`
  - [ ] Add `logout()`
  - [ ] Add `checkAuth()`
  - [ ] Add `refreshToken()`
  - **Acceptance:** Auth endpoints available

- [ ] 5.2 Add request interceptor
  - [ ] Add auth token to headers
  - [ ] Handle 401 responses
  - [ ] Refresh token on 401
  - [ ] Retry request after refresh
  - **Acceptance:** Auth token auto-included, 401 handled

---

### Wave 6: Components Implementation (Days 4-5)

- [ ] 6.1 Create LoginForm component
  - [ ] File: `/components/shared/LoginForm.tsx`
  - [ ] Props: `onSubmit`, `isLoading`, `error`
  - [ ] Email + password inputs
  - [ ] Form validation
  - [ ] Error display
  - **Acceptance:** Form works with validation

- [ ] 6.2 Create PasswordInput component
  - [ ] File: `/components/ui/PasswordInput.tsx`
  - [ ] Toggle password visibility
  - [ ] Integrate with form
  - [ ] Show strength indicator (optional)
  - **Acceptance:** Password input works

- [ ] 6.3 Refactor login page
  - [ ] File: `/app/login/page.tsx`
  - [ ] Use LoginForm component
  - [ ] Use useAuth hook
  - [ ] Use shared components
  - [ ] Remove hardcoded logic
  - **Acceptance:** Login page clean, uses modular imports

---

### Wave 7: Testing (Days 5-6)

- [ ] 7.1 Write tests for hooks
  - [ ] Test `useAuth` initialization
  - [ ] Test `useForm` value updates
  - [ ] Test `useAsync` lifecycle
  - [ ] Test `useLocalStorage` persistence
  - [ ] File: `/lib/hooks/__tests__/hooks.test.ts`
  - **Acceptance:** All hooks tested, >85% coverage

- [ ] 7.2 Write tests for validators
  - [ ] Test email validator
  - [ ] Test password validator
  - [ ] Test form validator
  - [ ] Test field validators
  - [ ] File: `/lib/validators/__tests__/validators.test.ts`
  - **Acceptance:** All validators tested, >85% coverage

- [ ] 7.3 Write tests for storage
  - [ ] Test localStorage operations
  - [ ] Test sessionStorage operations
  - [ ] Test cookie operations
  - [ ] Test JSON serialization
  - [ ] File: `/lib/storage/__tests__/storage.test.ts`
  - **Acceptance:** All storage tested, >85% coverage

- [ ] 7.4 Write integration test for login flow
  - [ ] Test complete login flow
  - [ ] Test error states
  - [ ] Test session persistence
  - [ ] Test logout
  - [ ] Test token refresh
  - [ ] File: `/app/login/__tests__/login.integration.test.ts`
  - **Acceptance:** Login flow works end-to-end

---

### Wave 8: Documentation (Day 6)

- [ ] 8.1 Create hooks usage guide
  - [ ] File: `/docs/HOOKS_GUIDE.md`
  - [ ] Example for each hook
  - [ ] Use cases
  - [ ] Best practices
  - **Acceptance:** Guide complete

- [ ] 8.2 Create validators usage guide
  - [ ] File: `/docs/VALIDATORS_GUIDE.md`
  - [ ] Example for each validator
  - [ ] Composition patterns
  - [ ] Error handling
  - **Acceptance:** Guide complete

- [ ] 8.3 Create storage utilities guide
  - [ ] File: `/docs/STORAGE_GUIDE.md`
  - [ ] Storage API usage
  - [ ] Security considerations
  - [ ] Cookie handling
  - **Acceptance:** Guide complete

- [ ] 8.4 Create auth integration guide
  - [ ] File: `/docs/AUTH_INTEGRATION_GUIDE.md`
  - [ ] Show login page integration
  - [ ] Show protected routes
  - [ ] Show token refresh pattern
  - **Acceptance:** Guide complete

- [ ] 8.5 Update main architecture guide
  - [ ] File: `/MODULAR_STRUCTURE_GUIDE.md`
  - [ ] Add Phase 2 section
  - [ ] Add new folders
  - [ ] Add import patterns
  - **Acceptance:** Guide updated

---

### Wave 9: Verification (Day 7)

- [ ] 9.1 Run full test suite
  - [ ] All unit tests pass
  - [ ] All integration tests pass
  - [ ] Coverage >85%
  - **Acceptance:** Tests pass

- [ ] 9.2 Type checking
  - [ ] Run `tsc --noEmit`
  - [ ] No TypeScript errors
  - [ ] No circular dependencies
  - **Acceptance:** TypeScript clean

- [ ] 9.3 Code review checklist
  - [ ] No hardcoded URLs
  - [ ] All imports use `@/`
  - [ ] All exports in index files
  - [ ] Documentation complete
  - **Acceptance:** Code review passed

- [ ] 9.4 Final integration test
  - [ ] Complete login flow works
  - [ ] Error states handled
  - [ ] Session persists
  - [ ] No console errors
  - **Acceptance:** App works end-to-end

---

## Task Dependencies

```
Wave 1 (Setup/Types)
  ↓
Wave 2 (Hooks) ← Wave 3 (Validators) ← Wave 4 (Storage)
  ↓
Wave 5 (API Client) ← Wave 6 (Components)
  ↓
Wave 7 (Testing)
  ↓
Wave 8 (Documentation)
  ↓
Wave 9 (Verification)
```

---

## Deliverables by Wave

**Wave 1:** Types setup  
**Wave 2:** Hooks complete  
**Wave 3:** Validators complete  
**Wave 4:** Storage complete  
**Wave 5:** API client extensions  
**Wave 6:** Components complete  
**Wave 7:** Testing complete (>85% coverage)  
**Wave 8:** Documentation complete  
**Wave 9:** Final verification  

---

## Success Criteria

✅ All files created  
✅ All tests pass (>85% coverage)  
✅ TypeScript no errors  
✅ Login page works end-to-end  
✅ Documentation complete  
✅ No breaking changes to Phase 1  
✅ Code review approved  

---

## Estimated Timeline

- **Developer Days:** 7 days (1 dev) or 3-4 days (2-3 devs)
- **Start:** After Phase 1 review
- **End:** One week from start
