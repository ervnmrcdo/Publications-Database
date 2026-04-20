# APPLICATION SUBMISSION w/ tagged authors (not yet started)

- workflow:
  - applicant submits for an application
  - upon completion of forms, at the final page, there should be a save as draft button instead as well as a submit button
    [save as draft] => tags this application as `DRAFT` which should appear ONLY under the `DRAFTS` catgory in the `submissions page` of all tagged authors
  - upon pressing an application within the `DRAFT` category, any tagged author should have `EDITING` rights using the `DocumentEditor` component, in the form of multiple dropdown buttons similar to how it is in the `ReviewInstance.tsx`
  - Then after everything has been accounted for, ANY TAGGED author should be able to submit the forms with a dialog that asks the user if they are sure that they want to submit.
    - Scenario 1 (admin validates):
      - the validated forms should be visible in the `VALIDATED` category within the `submissions page` of ALL TAGGED AUTHORS.
    - Scenario 2 (admin returns with errors):
      - the rejected form should be visible in the `RETURNED` category within the `submissions page` of ALL TAGGED AUTHORS.
      - ALL TAGGED authors should then be able to again edit the draft of the application form.
      -

---

# Draft Storage Path Migration (STARTED)

[PROBLEM] The current path of storage and retrieval in draft buckets:
  - `{userID}/{awardId}/{publicationId}/form{formType}.{ext}`

[IMPLEMENTATION] Change to flat path for NEW drafts only:
  - `{submissionID}_form{formType}.{ext}`

Files to update:
- `pages/api/drafts/callback.ts` (line 33)
- `pages/api/submit-award/route.ts` (line 28)
- `pages/api/resubmit-award-from-drafts/route.ts` (lines 19, 32)
- `pages/api/admin/get-draft-form/route.ts` (line 32)
- `pages/api/get/returned-forms.ts` (line 34)

---

## Phase 1: Backend - New/Modified APIs

### 1.1 New Endpoints
- `POST /api/save-as-draft` - Save forms as draft (status='draft'), copy to drafts bucket
- `GET /api/get/drafts` - Fetch drafts where user is tagged OR is submitter
- `POST /api/submit-from-draft` - Any tagged author can submit draft → PENDING status

### 1.2 Modified Endpoints
- `GET /api/get/accepted-forms` - Also return validated where user is in tagged_authors
- `GET /api/get/returned-forms` - Also return where user is in tagged_authors
- `GET /api/admin/get-draft-form` - Support tagged author editing

---

## Phase 2: Frontend - Submissions Page

### 2.1 New Components
- `components/Submissions/DraftsListing.tsx` - List drafts (After Returned, before PendingAwardsTable)
- `components/Submissions/DraftInstance.tsx` - View/edit draft with DocumentEditor (dropdowns like ReviewInstance)

### 2.2 Modified Components
- `components/Submissions/SubmissionsPage.tsx` - Add DraftsListing between ReturnedListing and PendingAwardsTable

---

## Phase 3: Frontend - Document Creation Flow

### 3.1 Final Form Page
- Add "Save as Draft" button next to Submit button
- Add confirmation dialogs for both Save as Draft and Submit

---

## Implementation Order

1. Phase 1: Storage path migration in draft APIs
2. Phase 2: New API endpoints + modify existing
3. Phase 3: DraftsListing + DraftInstance components
4. Phase 4: Save as Draft UI + Submit dialogs