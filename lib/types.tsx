export interface Author {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  university?: string;
  college?: string;
  department?: string;
  position: string;
  contact_number: string;
  email_address: string;
}

export interface PublicationType {
  id: number;
  name: string;
  award_id: number;
  publications: Publication[];
}

export interface AwardWithPublications {
  award_id: number;
  title: string;
  description: string | null;
  publication_per_award: PublicationType[];
}

export interface Award {
  id: number;
  title: string;
  description: string;
}

export interface Publication {
  type: string;
  publication_id: string;
  users: Author[];
  title: string;
  date_published: string;
  journal_name: string;
  volume_number: string;
  page_numbers: string;
  publisher: string;
  issue_number: string;
  publication_status: string;
  publication_type_id?: number;
  doi?: string | null;
}

export interface SupabasePublication {
  publication_id: number;
  type: string;
  publication_type_id: number;
  title: string;
  publisher: string;
  publication_status: string;
  date_published: string;
  issue_number: string;
  page_numbers: string;
  volume_number: string;
  journal_name: string;
  doi: string;
}

export type Application = {
  application_id: string;
  name: string;
  publicationTitle?: string;
  role: "Student" | "Faculty";
  award: string;
  dateSubmitted: string;
  pdfUrl: string | null;
  logs: SubmissionLog[];
  form41Url?: string | null;
  form42Url?: string | null;
  form43Url?: string | null;
  form44Url?: string | null;
  awardId?: number; 
  journal_attachments?: Record<string, string>;
  book_attachments?: Record<string, string>;
};

export interface AcceptedForm {
  first_name: string;
  last_name: string;
  submission_id: string;
  date_submitted: string;
  award_title: string;
  logs: SubmissionLog[];
  isReturned: boolean;
  status?: string;
  form41_url?: string;
  form42_url?: string;
  form43_url?: string;
  form44_url?: string;
  pdfBufferData?: string;
  journal_attachments?: Record<string, string>;
  book_attachments?: Record<string, string>;
}

export interface RejectedForm {
  first_name: string;
  last_name: string;
  submission_id: string;
  date_submitted: string;
  award_title: string;
  publication_title?: string;
  tagged_authors?: { id: string; first_name?: string; last_name?: string }[];
  remarks: string;
  logs: SubmissionLog[];
  publication_id?: number;
  award_id?: number;
  submitter_id?: string;
  form41_url?: string | null;
  form42_url?: string | null;
  form43_url?: string | null;
  form44_url?: string | null;
  isReturned: boolean;
  journal_attachments?: Record<string, string>;
  book_attachments?: Record<string, string>;
}

export interface DraftForm {
  first_name?: string;
  last_name?: string;
  submission_id: string;
  date_submitted: string;
  award_title?: string;
  publication_title?: string;
  tagged_authors?: { id: string; first_name?: string; last_name?: string }[];
  logs: SubmissionLog[];
  publication_id?: number;
  award_id?: number;
  submitter_id?: string;
  form41_url?: string | null;
  form42_url?: string | null;
  form43_url?: string | null;
  form44_url?: string | null;
  journal_attachments?: Record<string, string>;
  book_attachments?: Record<string, string>;
  status: string;
}

export interface PendingAward {
  id: number;
  name: string;
  submitterType: string;
  dateSubmmitted: string;
  status: string;
  awardId: number;
  awardTitle: string;
}

export interface PendingForm {
  submission_id: number;
  first_name?: string;
  last_name?: string;
  name: string;
  publicationTitle?: string;
  date_submitted: string;
  award_title: string;
  status: string;
  logs: SubmissionLog[];
  form41Url?: string | null;
  form42Url?: string | null;
  form43Url?: string | null;
  form44Url?: string | null;
  journal_attachments?: Record<string, string>;
  book_attachments?: Record<string, string>;
}

export interface EditableAwardFormData {
  ipaData: IPAFormData;
  isResubmitting: boolean;
}

export interface RawData {
  applicant: Author;
  authors: Author[];
  selectedPublication: Publication;
  selectedAward: Award | null;
  shouldSubmit: boolean;
}

export interface SubmissionLog {
  remarks: string;
  date: string;
  action: 'RETURNED' | 'SUBMITTED' | 'VALIDATED' | 'RESUBMITTED';
  actor_name: string;
}

export interface IPAFormData {
  articleTitle: string;
  completeCitation: string;
  author1NameLastFirst: string;
  author1UniversityAndDept: string;
  totalAuthorNumber: string;
  journalName: string;
  WSCC: boolean;
  AHCI: boolean;
  SCIE: boolean;
  SSCI: boolean;
  CPCI: boolean;
  scopus: boolean;
  impactFactor: string;
  impactFactorYear: string;
  dateOfPublication: string;
  publisherName: string
  upSystemFunding: boolean;
  upCUGrant: boolean;
  dost: boolean;
  otherFunding: boolean;
  otherFundingSpecfics: string;
  author1Name: string;
  author1University: string;
  author1College: string;
  author1Department: string;
  author1Contact: string;
  author1Position: string
  author1Personnel: boolean;
  author1Faculty: boolean;
  author1ResearchFaculty: boolean;
  author1REPS: boolean;
  author1AdminStaff: boolean;
  author1UpAffiliated: boolean;
  author1Student: boolean;
  author1ProjectPersonnell: boolean;
  author1Permanent: boolean;
  author1Temporary: boolean;
  author1UpContractual: boolean;
  author1NonUpContractual: boolean;
  author1EmailAddress: string;
}


