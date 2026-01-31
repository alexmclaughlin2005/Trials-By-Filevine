# Phase 5B: Hard-Gate Stimulus Selection - Design Document

**Created:** January 27, 2026
**Status:** Design Phase
**Priority:** HIGH - Prevents bad user experience

---

## Executive Summary

**Problem:** Users can currently proceed through the Focus Group Setup Wizard without selecting any arguments, leading to meaningless simulations with no stimulus to react to.

**Solution:** Hard-gate the Arguments step - users cannot proceed past Step 2 without selecting at least one argument. If zero arguments exist, provide a direct "Create Argument" CTA instead of showing an empty list with a dismissible warning.

**User Value:**
- Prevents "garbage in, garbage out" scenarios
- Saves users from wasting 60-90 seconds on useless simulations
- Makes the required workflow obvious

---

## Current State Analysis

### What Happens Now

**File:** [focus-group-setup-wizard.tsx:590-619](apps/web/components/focus-group-setup-wizard.tsx#L590-L619)

**Current Behavior:**
1. User enters "Arguments" step (Step 2)
2. `ArgumentCheckboxList` component shows list of arguments
3. User can check/uncheck arguments
4. User clicks "Next" button
5. **No validation** - proceeds to Questions step regardless of selection

**Current Issues:**
- ❌ Can proceed with 0 arguments selected
- ❌ If case has 0 arguments, shows empty list with generic message
- ❌ No clear path to create arguments if none exist
- ❌ Simulator runs with no stimulus → meaningless results

### Arguments Step Component

**File:** [focus-group-setup-wizard/ArgumentCheckboxList.tsx](apps/web/components/focus-group-setup-wizard/ArgumentCheckboxList.tsx) (assumed - needs verification)

**Current Structure:**
```tsx
<ArgumentsSelectionStep
  caseId={caseId}
  session={session.session}
  arguments={caseArguments}
  onUpdate={(updates) => updateConfigMutation.mutate(updates)}
/>
```

---

## Proposed Solution

### 1. Hard-Gate: Block "Next" Button

**Validation Rule:** User must select at least 1 argument to proceed

**Implementation:**

```tsx
// In focus-group-setup-wizard.tsx

const canProceedFromArguments =
  session.session.selectedArguments &&
  session.session.selectedArguments.length > 0;

// Modify "Next" button in Arguments step
{currentStepIndex < steps.length - 1 ? (
  <Button
    variant="primary"
    onClick={handleNext}
    disabled={
      updateConfigMutation.isPending ||
      (currentStep === 'arguments' && !canProceedFromArguments)
    }
  >
    {updateConfigMutation.isPending ? 'Saving...' : 'Next'}
  </Button>
) : (
  // ... existing "Start Focus Group" button
)}
```

**Visual Feedback:**
- "Next" button disabled (gray, no hover)
- Tooltip on disabled button: "Select at least 1 argument to continue"
- Or: Show inline error message below arguments list

---

### 2. Empty State: Direct CTA to Create Argument

**Scenario:** Case has 0 arguments in the database

**Current Behavior:** Shows empty list or generic "No arguments" message

**New Behavior:** Show prominent empty state with "Create Argument" button

**Implementation:**

```tsx
// In ArgumentsSelectionStep component (focus-group-setup-wizard.tsx:590-619)

function ArgumentsSelectionStep({ caseId, session, arguments, onUpdate }) {
  // If no arguments exist, show empty state
  if (!arguments || arguments.length === 0) {
    return (
      <EmptyArgumentsState caseId={caseId} />
    );
  }

  // Existing checkbox list
  return (
    <ArgumentCheckboxList
      caseId={caseId}
      arguments={arguments}
      selectedArguments={session.selectedArguments || []}
      onUpdate={onUpdate}
    />
  );
}

// New component for empty state
function EmptyArgumentsState({ caseId }: { caseId: string }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">
          Choose Arguments to Test
        </h3>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Focus groups need an argument or opening statement to react to
        </p>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border-2 border-dashed border-filevine-gray-300 bg-filevine-gray-50 p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-filevine-gray-400" />
        <h4 className="mt-4 text-lg font-medium text-filevine-gray-900">
          No Arguments Created Yet
        </h4>
        <p className="mt-2 text-sm text-filevine-gray-600 max-w-md mx-auto">
          Before running a focus group, you need to create at least one argument
          or opening statement for the panel to react to.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => router.push(`/cases/${caseId}/arguments?action=create`)}
          >
            Create Your First Argument
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/cases/${caseId}/arguments`)}
          >
            Go to Arguments Page
          </Button>
        </div>
      </div>

      {/* Informational Box */}
      <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div className="ml-3">
            <h5 className="text-sm font-medium text-blue-800">
              What makes a good argument to test?
            </h5>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Opening statements for trial</li>
                <li>Key themes or theories of the case</li>
                <li>Closing arguments</li>
                <li>Responses to anticipated defenses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Non-Empty State: Validation Message

**Scenario:** Arguments exist, but user hasn't selected any

**Current Behavior:** Can click "Next" anyway

**New Behavior:** "Next" button disabled + inline validation message

**Implementation:**

```tsx
// In ArgumentCheckboxList component
function ArgumentCheckboxList({ caseId, arguments, selectedArguments, onUpdate }) {
  const hasSelection = selectedArguments.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-filevine-gray-900">
          Choose Arguments to Test
        </h3>
        <p className="mt-1 text-sm text-filevine-gray-600">
          Select one or more arguments for the panel to react to
        </p>
      </div>

      {/* Arguments List */}
      <div className="space-y-3">
        {arguments.map((arg) => (
          <ArgumentCheckbox
            key={arg.id}
            argument={arg}
            isSelected={selectedArguments.some(s => s.argumentId === arg.id)}
            onToggle={() => handleToggleArgument(arg)}
          />
        ))}
      </div>

      {/* Validation Message (only if no selection) */}
      {!hasSelection && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                At least 1 argument required
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                Select at least one argument to continue. The focus group panel
                needs something to react to.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {hasSelection && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-800">
            ✓ {selectedArguments.length} {selectedArguments.length === 1 ? 'argument' : 'arguments'} selected
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### 4. Inline Argument Preview (Bonus Enhancement)

**As suggested by colleague:** "Inline preview of what the panel is reacting to"

**Implementation:** Add collapsible preview card for each selected argument

```tsx
function ArgumentCheckbox({ argument, isSelected, onToggle }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 transition-all',
        isSelected
          ? 'border-filevine-blue bg-blue-50'
          : 'border-filevine-gray-200 hover:border-filevine-gray-300'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 h-5 w-5 rounded border-filevine-gray-300 text-filevine-blue"
        />

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-filevine-gray-900">{argument.title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-filevine-gray-600">
                <Badge variant="outline">{argument.argumentType}</Badge>
                <span>•</span>
                <span>{argument.content.length} characters</span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-filevine-blue hover:underline"
            >
              {isExpanded ? 'Hide' : 'Preview'}
            </button>
          </div>

          {/* Expandable Preview */}
          {isExpanded && (
            <div className="mt-3 rounded-md border border-filevine-gray-200 bg-white p-3">
              <p className="text-sm text-filevine-gray-700 whitespace-pre-wrap">
                {argument.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Technical Implementation

### Files to Modify

1. **[focus-group-setup-wizard.tsx](apps/web/components/focus-group-setup-wizard.tsx)**
   - Add validation logic for "Next" button
   - Modify `handleNext()` to check if arguments selected
   - Update button disabled state

2. **[focus-group-setup-wizard/ArgumentCheckboxList.tsx](apps/web/components/focus-group-setup-wizard/ArgumentCheckboxList.tsx)** (or inline in wizard)
   - Add empty state component
   - Add validation message
   - Add selection summary

3. **No backend changes required** (validation is frontend-only)

---

### Validation Logic

```typescript
// In focus-group-setup-wizard.tsx

const handleNext = async () => {
  // Validate arguments step
  if (currentStep === 'arguments') {
    const hasSelectedArguments =
      session.session.selectedArguments &&
      session.session.selectedArguments.length > 0;

    if (!hasSelectedArguments) {
      // Show error toast (optional)
      toast.error('Please select at least one argument to continue');
      return; // Block navigation
    }
  }

  // Proceed to next step
  if (currentStepIndex < steps.length - 1) {
    const nextStep = steps[currentStepIndex + 1].key;
    await updateConfigMutation.mutateAsync({ configurationStep: nextStep });
    setCurrentStep(nextStep);
  }
};
```

---

## User Experience Flow

### Scenario 1: Case Has Arguments

1. User enters Arguments step (Step 2)
2. Sees list of available arguments with checkboxes
3. **Attempts to click "Next" without selecting:**
   - "Next" button is disabled (gray)
   - Inline message: "At least 1 argument required"
   - Tooltip on hover: "Select at least 1 argument to continue"
4. **User selects 1 argument:**
   - "Next" button becomes enabled (blue)
   - Green success message: "✓ 1 argument selected"
5. User clicks "Next" → proceeds to Questions step

### Scenario 2: Case Has No Arguments

1. User enters Arguments step (Step 2)
2. Sees empty state with large icon and explanation
3. **Sees two CTAs:**
   - Primary: "Create Your First Argument"
   - Secondary: "Go to Arguments Page"
4. **User clicks "Create Your First Argument":**
   - Navigates to `/cases/[id]/arguments?action=create`
   - Argument creation modal/page opens
5. **User creates argument:**
   - Returns to Arguments page
   - Can now start focus group setup again
6. **Alternative: User clicks "Go to Arguments Page":**
   - Navigates to full Arguments page
   - Can create multiple arguments
   - Returns to focus group setup when ready

### Scenario 3: User Returns to Arguments Step

1. User is on Questions step (Step 3)
2. Clicks "Back" button
3. Returns to Arguments step
4. **Previously selected arguments are still checked**
5. User can change selection
6. Validation re-runs when clicking "Next"

---

## Edge Cases & Error Handling

### Edge Case 1: Arguments Deleted During Wizard Session

**Scenario:** User starts wizard, someone else deletes all arguments

**Solution:**
- On "Next" button click, re-validate that arguments still exist
- If deleted, show error: "The selected arguments are no longer available"
- Force user back to Arguments step

### Edge Case 2: User Deselects All Arguments

**Scenario:** User had 2 arguments selected, unchecks both

**Solution:**
- Validation message appears immediately
- "Next" button becomes disabled
- User must re-select at least 1

### Edge Case 3: Browser Refresh During Wizard

**Scenario:** User refreshes page on Questions step

**Solution:**
- Session state is stored in database
- On refresh, wizard reloads from database
- If `selectedArguments` array is empty, user is blocked from proceeding past Arguments step

---

## Visual Design Specifications

### Disabled "Next" Button

```tsx
<Button
  variant="primary"
  onClick={handleNext}
  disabled={currentStep === 'arguments' && !hasSelectedArguments}
  className={cn(
    currentStep === 'arguments' && !hasSelectedArguments &&
    'opacity-50 cursor-not-allowed'
  )}
  title={
    currentStep === 'arguments' && !hasSelectedArguments
      ? 'Select at least 1 argument to continue'
      : undefined
  }
>
  Next
</Button>
```

### Validation Message

```tsx
<div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
  <div className="flex">
    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
    <div className="ml-3">
      <p className="text-sm font-medium text-yellow-800">
        At least 1 argument required
      </p>
      <p className="mt-1 text-sm text-yellow-700">
        Select at least one argument to continue. The focus group panel
        needs something to react to.
      </p>
    </div>
  </div>
</div>
```

### Empty State

```tsx
<div className="rounded-lg border-2 border-dashed border-filevine-gray-300 bg-filevine-gray-50 p-12 text-center">
  <FileText className="mx-auto h-12 w-12 text-filevine-gray-400" />
  <h4 className="mt-4 text-lg font-medium text-filevine-gray-900">
    No Arguments Created Yet
  </h4>
  <p className="mt-2 text-sm text-filevine-gray-600 max-w-md mx-auto">
    Before running a focus group, you need to create at least one argument
    or opening statement for the panel to react to.
  </p>
  <Button variant="primary" className="mt-6">
    Create Your First Argument
  </Button>
</div>
```

---

## Success Metrics

### User Metrics
- **0% empty focus group runs** (down from current unknown %)
- **100% of focus groups have stimulus** (at least 1 argument)
- **Time to realize mistake:** 0 seconds (prevented upfront vs. after 60-90 second simulation)

### Technical Metrics
- **Validation accuracy:** 100% (simple array length check)
- **False positives:** 0% (no cases where valid selection is blocked)
- **False negatives:** 0% (no cases where invalid selection proceeds)

### Business Metrics
- **User frustration incidents:** -100% (no more wasted simulations)
- **Support tickets:** -50% (fewer "my results are empty" complaints)

---

## Implementation Timeline

### Phase 1: Core Validation (Day 1 - Morning)
- [ ] Add validation logic to `handleNext()` function
- [ ] Modify "Next" button disabled state
- [ ] Add validation message component
- [ ] Test validation with 0, 1, and 2+ arguments

**Estimated Time:** 2 hours

### Phase 2: Empty State (Day 1 - Afternoon)
- [ ] Create `EmptyArgumentsState` component
- [ ] Add routing to arguments page with `action=create` param
- [ ] Update arguments page to handle `action=create` (open modal)
- [ ] Add informational box with best practices

**Estimated Time:** 2-3 hours

### Phase 3: Inline Preview (Day 1 - Evening - OPTIONAL)
- [ ] Add expand/collapse to argument checkboxes
- [ ] Show full argument content on expand
- [ ] Add character count and type badge

**Estimated Time:** 1-2 hours (optional)

### Phase 4: Testing & Polish (Day 2 - Morning)
- [ ] Test empty state flow
- [ ] Test validation message
- [ ] Test edge cases (deselect all, browser refresh)
- [ ] Add tooltip to disabled button
- [ ] Update documentation

**Estimated Time:** 1-2 hours

**Total Estimated Time:** 6-9 hours (1 day)

---

## Open Questions

1. **Should we allow proceeding with 0 arguments in special cases?**
   - E.g., "Just test panel dynamics without stimulus"
   - **Recommendation:** No - defeats the purpose of focus groups

2. **Should we show "Create Argument" inline in the wizard?**
   - Pro: Faster workflow, no navigation away
   - Con: Complex modal state management
   - **Recommendation:** Not for MVP, redirect to arguments page

3. **Should we validate argument quality?**
   - E.g., "Argument is too short (minimum 100 characters)"
   - Pro: Ensures meaningful stimulus
   - Con: May be too restrictive
   - **Recommendation:** Not for MVP, but good future enhancement

4. **Should we allow selecting arguments from other cases?**
   - Pro: Useful for testing similar themes
   - Con: Context confusion
   - **Recommendation:** No - arguments are case-specific

---

## Future Enhancements (Post-MVP)

1. **Argument Quality Validation**
   - Minimum length (e.g., 100 characters)
   - Check for placeholder text ("TODO", "Edit me", etc.)
   - AI-powered quality score

2. **Inline Argument Creation**
   - Quick-create form inside wizard
   - Saves navigation time
   - Pre-populates title and type

3. **Argument Recommendations**
   - AI suggests which arguments to test based on case facts
   - "This argument relates to your key facts"

4. **Multi-Argument Comparison**
   - Visual diff showing how arguments differ
   - "Test all 3 arguments in parallel"

---

## Related Documentation

- [CURRENT_STATE.md](./CURRENT_STATE.md) - Current system status
- [FOCUS_GROUP_SETUP_WIZARD.tsx](apps/web/components/focus-group-setup-wizard.tsx) - Wizard implementation
- [PHASE_5_UX_ENHANCEMENTS_PLAN.md](./PHASE_5_UX_ENHANCEMENTS_PLAN.md) - Overall UX plan

---

## Approval & Sign-off

**Created By:** Claude Code Assistant
**Date:** January 27, 2026
**Status:** ⏳ Awaiting User Approval

**User Approval:** [ ] Approved  [ ] Needs Changes  [ ] Rejected

**Comments:**
_[User feedback goes here]_

---

**End of Design Document**
