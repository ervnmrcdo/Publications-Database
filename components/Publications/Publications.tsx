"use client";

import { useAuth } from '@/context/AuthContext'
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client'
import { SupabasePublication } from '@/lib/types';

type TaggableUser = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
};

type PublicationSortOption = 'date_asc' | 'date_desc' | 'title_asc' | 'title_desc';
const PUBLICATIONS_PER_PAGE = 12;

export default function Publications() {
  const { user } = useAuth();
  const [publications, setPublications] = useState<SupabasePublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoFetching, setIsAutoFetching] = useState(false);

  type Mode = "view" | "add" | "edit";
  const [mode, setMode] = useState<Mode>("view");

  const [bookOrJournal, setBookOrJournal] = useState<'JOURNAL' | 'BOOK' | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [typeFilter, setTypeFilter] = useState<'all' | 'JOURNAL' | 'BOOK' | 'unclassified'>('all')

  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('');
  const [datePublished, setDatePublished] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [pageNumbers, setPageNumbers] = useState('');
  const [volumeNumber, setVolumeNumber] = useState('');
  const [journalName, setJournalName] = useState('');
  const [doi, setDOI] = useState('');

  const [selectedPublication, setSelectedPublication] = useState<SupabasePublication | null>(null);
  const [highlightedPubId, setHighlightedPubId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<PublicationSortOption>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [taggableUsers, setTaggableUsers] = useState<TaggableUser[]>([]);
  const [selectedTaggedAuthors, setSelectedTaggedAuthors] = useState<TaggableUser[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const supabase = createClient();

  const sortedPublications = useMemo(() => {
    const compareByPublicationId = (a: SupabasePublication, b: SupabasePublication) => {
      return (a.publication_id ?? 0) - (b.publication_id ?? 0);
    };

    const comparePublications = (a: SupabasePublication, b: SupabasePublication) => {
      if (sortOption === 'date_asc' || sortOption === 'date_desc') {
        const aHasDate = Boolean(a?.date_published);
        const bHasDate = Boolean(b?.date_published);

        // Keep missing dates at the end regardless of direction.
        if (aHasDate && !bHasDate) return -1;
        if (!aHasDate && bHasDate) return 1;

        const aDate = aHasDate ? new Date(a.date_published as string).getTime() : Number.NEGATIVE_INFINITY;
        const bDate = bHasDate ? new Date(b.date_published as string).getTime() : Number.NEGATIVE_INFINITY;

        if (aDate !== bDate) {
          return sortOption === 'date_asc' ? aDate - bDate : bDate - aDate;
        }

        return compareByPublicationId(a, b);
      }

      const aTitle = (a?.title ?? '').trim();
      const bTitle = (b?.title ?? '').trim();
      const titleCompare = aTitle.localeCompare(bTitle, undefined, { sensitivity: 'base' });

      if (titleCompare !== 0) {
        return sortOption === 'title_asc' ? titleCompare : -titleCompare;
      }

      return compareByPublicationId(a, b);
    };

    return [...publications].sort(comparePublications);
  }, [publications, sortOption]);

  const filteredPublications = useMemo(() => {
    if (typeFilter === 'all') return sortedPublications
    if (typeFilter === 'unclassified') return sortedPublications.filter(p => !p.book_or_journal)
    return sortedPublications.filter(p => p.book_or_journal === typeFilter)
  }, [sortedPublications, typeFilter])

  const totalItems = filteredPublications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PUBLICATIONS_PER_PAGE));

  const paginatedPublications = useMemo(() => {
    const startIndex = (currentPage - 1) * PUBLICATIONS_PER_PAGE;
    const endIndex = startIndex + PUBLICATIONS_PER_PAGE;
    return filteredPublications.slice(startIndex, endIndex);
  }, [filteredPublications, currentPage]);

  const paginationSummary = useMemo(() => {
    if (totalItems === 0) {
      return 'Showing 0-0 of 0';
    }

    const startItem = (currentPage - 1) * PUBLICATIONS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * PUBLICATIONS_PER_PAGE, totalItems);
    return `Showing ${startItem}-${endItem} of ${totalItems}`;
  }, [currentPage, totalItems]);

  const visiblePageNumbers = useMemo(() => {
    const maxVisible = 5;
    const halfWindow = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    fetchPublications();
  }, [user?.id]);

  useEffect(() => {
    fetchTaggableUsers();
  }, [user?.id]);

  const fetchPublications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/publications?userId=${user.id}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setPublications(data);
      }
    } catch (err) {
      console.error('Failed to fetch publications:', err);
    }

    setLoading(false);
  };

  const fetchTaggableUsers = async () => {

    const USER_ID = user?.id
    if (USER_ID) {
      try {
        const res = await fetch(`/api/tag-authors?userId=${USER_ID}`);
        if (!res.ok) throw new Error('Failed to fetch taggable users');
        const data = await res.json();
        setTaggableUsers(data.data || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const loadExistingTaggedAuthors = async (pubId: number) => {
    try {
      const res = await fetch(`/api/fetch-tagged-authors?publicationId=${pubId}&userId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch tagged authors');
      const data = await res.json();
      setSelectedTaggedAuthors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSelectedTaggedAuthors([]);
    }
  };

  const saveTaggedAuthors = async (pubId: number) => {
    if (!user) return;
    try {
      const taggedAuthorIds = selectedTaggedAuthors.map(author => author.id);
      await fetch('/api/tag-authors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicationId: pubId,
          userId: user.id,
          taggedAuthors: taggedAuthorIds
        })
      });
    } catch (err) {
      console.error('Failed to save tagged authors:', err);
    }
  };


  const addTaggedAuthor = (userToAdd: TaggableUser) => {
    if (bookOrJournal === 'JOURNAL' && selectedTaggedAuthors.length >= 6) {
      alert('Maximum of 6 authors allowed for journal type publications');
      return;
    }
    if (!selectedTaggedAuthors.find(a => a.id === userToAdd.id)) {
      setSelectedTaggedAuthors([...selectedTaggedAuthors, userToAdd]);
    }
    setTagSearchQuery('');
    setShowTagDropdown(false);
  };

  const removeTaggedAuthor = (userId: string) => {
    setSelectedTaggedAuthors(selectedTaggedAuthors.filter(a => a.id !== userId));
  };

  const resetTaggingState = () => {
    setSelectedTaggedAuthors([]);
    setTagSearchQuery('');
    setShowTagDropdown(false);
  };

  function resetForm() {
    setBookOrJournal(null)
    setTitle('')
    setPublisher('')
    setPublicationStatus('')
    setDatePublished('')
    setIssueNumber('')
    setPageNumbers('')
    setVolumeNumber('')
    setJournalName('')
    setDOI('')
    setSelectedPublication(null)
    resetTaggingState()
  }

  const addPublication = async () => {
    if (!title.trim() || !bookOrJournal || !user) return;

    setLoading(true);
    const { data: pubData, error: pubError } = await supabase
      .from('publications')
      .insert([
        {
          book_or_journal: bookOrJournal,
          title,
          publisher,
          publication_status: publicationStatus,
          date_published: datePublished,
          issue_number: issueNumber,
          page_numbers: pageNumbers,
          volume_number: volumeNumber,
          journal_name: journalName,
          doi: doi
        }
      ])
      .select();

    if (pubError || !pubData || pubData.length === 0) {
      setLoading(false);
      console.log(pubError)
      alert('Failed to add publication.');
      return;
    }

    const newPub = pubData[0];

    const taggedAuthorIds = selectedTaggedAuthors.map(author => author.id);

    // link publication to current user adding with tagged_authors (includes user's own ID)
    const { error: linkError } = await supabase
      .from('publication_authors')
      .insert([
        {
          publication_id: newPub.publication_id,
          user_id: user.id,
          tagged_authors: [...taggedAuthorIds, user.id],
        }
      ]);

    if (linkError) {
      setLoading(false);
      alert('Failed to link publication to user.');
      return;
    }

    // insert rows for each tagged author
    for (const authorId of taggedAuthorIds) {
      await supabase
        .from('publication_authors')
        .insert([{
          publication_id: newPub.publication_id,
          user_id: authorId,
          tagged_authors: [...taggedAuthorIds, user.id],
        }]);
    }

    await fetchPublications();
    setHighlightedPubId(newPub.publication_id);

    setTimeout(() => {
      setHighlightedPubId(null)
    }, 10000);
    resetForm();
    setMode("view");
    setLoading(false);
  };

  async function editPublication() {
    if (!selectedPublication) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('publications')
        .update({
          book_or_journal: bookOrJournal,
          title,
          publisher,
          publication_status: publicationStatus,
          date_published: datePublished,
          issue_number: issueNumber,
          page_numbers: pageNumbers,
          volume_number: volumeNumber,
          journal_name: journalName,
          doi: doi
        })
        .eq('publication_id', selectedPublication.publication_id)

      if (error) throw error

      await saveTaggedAuthors(selectedPublication.publication_id);
      await fetchPublications()
      setHighlightedPubId(selectedPublication.publication_id)

      setTimeout(() => {
        setHighlightedPubId(null)
      }, 10000)
      resetForm()
      setMode("view")
      alert('Publication updated!')
    } catch (error) {
      console.error(error)
      alert('Error updating publication')
    } finally {
      setLoading(false)
    }
  }

  async function deletePublication() {
    if (!selectedPublication) return

    const confirmed = window.confirm(
      "Are you sure you want to delete this publication? This publication will be deleted permanently."
    )

    if (!confirmed) return

    try {
      setLoading(true)

      const { error: linkError } = await supabase
        .from('publication_authors')
        .delete()
        .eq('publication_id', selectedPublication.publication_id)
        .eq('user_id', user?.id)

      if (linkError) throw linkError

      const { error: pubError } = await supabase
        .from('publications')
        .delete()
        .eq('publication_id', selectedPublication.publication_id)

      if (pubError) throw pubError

      await fetchPublications()
      setSelectedPublication(null)
      alert('Publication deleted successfully!')
    } catch (error) {
      console.error(error)
      alert('Error deleting publication')
    } finally {
      setLoading(false)
    }
  }

  const bulkSetType = async (newType: 'JOURNAL' | 'BOOK') => {
    const ids = Array.from(selectedIds)
    const { error } = await supabase
      .from('publications')
      .update({ book_or_journal: newType })
      .in('publication_id', ids)
    if (!error) {
      setPublications(prev =>
        prev.map(p => selectedIds.has(p.publication_id) ? { ...p, book_or_journal: newType } : p)
      )
      setSelectedIds(new Set())
    }
  }

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(filteredPublications.map(p => p.publication_id)))

  async function runCrawler() {
    try {
      setIsAutoFetching(true);

      const response = await fetch('/api/run-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Crawler execution failed:', result);
        alert(result.message || 'Failed to fetch publications automatically.');
        return;
      }

      console.log('Crawler stdout:\n', result.stdout || 'No output');
      if (result.stderr) {
        console.warn('Crawler stderr:\n', result.stderr);
      }

      await fetchPublications();

      const summary = result.summary || {};
      alert(
        `Automatic fetch complete. Fetched: ${summary.fetchedPublications || 0}, Added: ${summary.insertedPublications || 0}, Linked to profile: ${summary.linkedPublications || 0}.`
      );
    } catch (error) {
      console.error('Failed to call crawler endpoint:', error);
      alert('Error running crawler. Check browser console for details.');
    } finally {
      setIsAutoFetching(false);
    }
  }

  return (
    <div className={`flex-1 overflow-auto bg-[#0f1117] text-gray-300 p-8 
      ${isAutoFetching ? "cursor-wait" : "cursor-default"}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700 mt-8">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-white">My Publications</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor="publication-sort" className="text-sm text-gray-300">Sort by</label>
                <select
                  id="publication-sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as PublicationSortOption)}
                  className="p-2 rounded bg-[#252836] text-white border border-gray-600"
                >
                  <option value="date_asc">Ascending Date</option>
                  <option value="date_desc">Descending Date</option>
                  <option value="title_asc">Name Ascending (A-Z)</option>
                  <option value="title_desc">Name Descending (Z-A)</option>
                </select>
              </div>
              <button
                onClick={runCrawler}
                disabled={isAutoFetching}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
              >
                {isAutoFetching ? 'Fetching...' : 'Fetch Publications Automatically'}
              </button>
              <button
                onClick={() => {
                  resetForm()
                  setMode("add");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Add Publication
              </button>
            </div>
          </div>

          {(mode === "add" || mode === "edit") && (
            <div className="mb-6 grid gap-2 grid-cols-1 md:grid-cols-2">
              <select
                value={bookOrJournal ?? ''}
                onChange={(e) => setBookOrJournal((e.target.value as 'JOURNAL' | 'BOOK') || null)}
                className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600"
              >
                <option value="">Select Type</option>
                <option value="JOURNAL">Journal</option>
                <option value="BOOK">Book</option>
              </select>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Publisher" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={doi} onChange={(e) => setDOI(e.target.value)} placeholder="DOI" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="date" value={datePublished} onChange={(e) => setDatePublished(e.target.value)} placeholder="Date Published" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={issueNumber} onChange={(e) => setIssueNumber(e.target.value)} placeholder="Issue Number" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={pageNumbers} onChange={(e) => setPageNumbers(e.target.value)} placeholder="Page Numbers" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={volumeNumber} onChange={(e) => setVolumeNumber(e.target.value)} placeholder="Volume Number" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={journalName} onChange={(e) => setJournalName(e.target.value)} placeholder="Journal Name" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Tag Authors</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => {
                      setTagSearchQuery(e.target.value);
                      setShowTagDropdown(true);
                    }}
                    onFocus={() => setShowTagDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                    placeholder="Search authors to tag..."
                    className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600"
                  />
                  {showTagDropdown && tagSearchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-[#252836] border border-gray-600 rounded-md shadow-lg max-h-48 overflow-auto">
                      {taggableUsers
                        .filter(user => {
                          const fullName = `${user.last_name}, ${user.first_name} ${user.middle_name || ''}`.toLowerCase();
                          return fullName.includes(tagSearchQuery.toLowerCase()) &&
                            !selectedTaggedAuthors.find(a => a.id === user.id);
                        })
                        .slice(0, 10)
                        .map(user => (
                          <button
                            key={user.id}
                            onClick={() => addTaggedAuthor(user)}
                            className="w-full text-left px-3 py-2 text-white hover:bg-gray-600 transition"
                          >
                            {user.last_name}, {user.first_name} {user.middle_name}
                          </button>
                        ))}
                      {taggableUsers.filter(user => {
                        const fullName = `${user.last_name}, ${user.first_name} ${user.middle_name || ''}`.toLowerCase();
                        return fullName.includes(tagSearchQuery.toLowerCase()) &&
                          !selectedTaggedAuthors.find(a => a.id === user.id);
                      }).length === 0 && (
                          <div className="px-3 py-2 text-gray-400">No matching authors found</div>
                        )}
                    </div>
                  )}
                </div>
                {selectedTaggedAuthors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTaggedAuthors.map(author => (
                      <span
                        key={author.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded"
                      >
                        {author.last_name}, {author.first_name} {author.middle_name}
                        <button
                          onClick={() => removeTaggedAuthor(author.id)}
                          className="hover:text-red-300 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  onClick={mode === "edit" ? editPublication : addPublication}
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setMode("view");
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(['all', 'JOURNAL', 'BOOK', 'unclassified'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setTypeFilter(f); setCurrentPage(1); setSelectedIds(new Set()) }}
                className={`px-3 py-1 rounded text-sm transition ${typeFilter === f ? 'bg-blue-600 text-white' : 'bg-[#252836] text-gray-300 hover:bg-gray-700'}`}
              >
                {f === 'all' ? 'All' : f === 'unclassified' ? 'Unclassified' : f === 'JOURNAL' ? 'Journal' : 'Book'}
              </button>
            ))}
            <button
              onClick={selectAll}
              className="ml-auto px-3 py-1 rounded text-sm bg-[#252836] text-gray-300 hover:bg-gray-700 transition"
            >
              Select All
            </button>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : filteredPublications.length === 0 ? (
            <p className="text-gray-400">No publications found.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {paginatedPublications.map((pub) => (
                  <li
                    key={pub.publication_id}
                    onClick={() => {
                      setSelectedPublication(pub)
                      setMode("view");

                      setBookOrJournal(pub.book_or_journal ?? null)
                      setTitle(pub.title || '')
                      setPublisher(pub.publisher || '')
                      setDOI(pub.doi || '')
                      setDatePublished(pub.date_published || '')
                      setIssueNumber(pub.issue_number || '')
                      setPageNumbers(pub.page_numbers || '')
                      setVolumeNumber(pub.volume_number || '')
                      setJournalName(pub.journal_name || '')

                      loadExistingTaggedAuthors(pub.publication_id)
                    }}
                    className={`relative p-4 rounded-lg border cursor-pointer transition
                    ${highlightedPubId === pub.publication_id
                        ? "bg-green-900 border-green-500"
                        : selectedIds.has(pub.publication_id)
                          ? "bg-blue-900/30 border-blue-500"
                          : "bg-[#23263a] border-gray-600 hover:border-blue-500"
                      }
                  `}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(pub.publication_id)}
                        onClick={(e) => toggleSelect(pub.publication_id, e)}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 cursor-pointer accent-blue-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-bold text-lg text-white">{pub.title}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            pub.book_or_journal === 'JOURNAL' ? 'bg-blue-500/20 text-blue-400' :
                            pub.book_or_journal === 'BOOK' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-600/40 text-gray-400'
                          }`}>
                            {pub.book_or_journal ?? 'Unclassified'}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          Date Published: {pub.date_published || 'N/A'}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Publisher: {pub.publisher}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-400">{paginationSummary}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-600 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-2 rounded"
                  >
                    Prev
                  </button>

                  {visiblePageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`text-white px-3 py-2 rounded ${page === currentPage
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-[#252836] hover:bg-gray-700 border border-gray-600'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-gray-600 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-2 rounded"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === "view" && selectedPublication && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-[#1b1e2b] p-6 rounded-lg w-full max-w-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">
                  {selectedPublication.title}
                </h3>

                <div className="space-y-2 text-gray-300 text-sm">
                  <p><span className="text-gray-400">Type:</span> {selectedPublication.book_or_journal ?? 'Unclassified'}</p>
                  <p><span className="text-gray-400">Publisher:</span> {selectedPublication.publisher}</p>
                  <p><span className="text-gray-400">Date Published:</span> {selectedPublication.date_published}</p>
                  <p><span className="text-gray-400">Issue:</span> {selectedPublication.issue_number}</p>
                  <p><span className="text-gray-400">Pages:</span> {selectedPublication.page_numbers}</p>
                  <p><span className="text-gray-400">Volume:</span> {selectedPublication.volume_number}</p>
                  <p><span className="text-gray-400">Journal:</span> {selectedPublication.journal_name}</p>
                  <p><span className="text-gray-400">DOI:</span> {selectedPublication.doi}</p>
                  {selectedTaggedAuthors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-gray-400 mb-1">Tagged Authors:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTaggedAuthors.map(author => (
                          <span
                            key={author.id}
                            className="inline-block px-2 py-1 bg-gray-700 text-white text-sm rounded"
                          >
                            {author.last_name}, {author.first_name} {author.middle_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (!selectedPublication) return
                        setMode("edit")
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        console.log("refreshed") // to add crawler functionality here
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Update
                    </button>

                    <button
                      onClick={deletePublication}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPublication(null);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </div >
            </div >
          )
          }
        </div >
      </div >

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1b1e2b] border border-gray-600 rounded-xl px-6 py-3 shadow-xl z-40">
          <span className="text-gray-300 text-sm">{selectedIds.size} selected</span>
          <button onClick={() => bulkSetType('JOURNAL')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">Set as Journal</button>
          <button onClick={() => bulkSetType('BOOK')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition">Set as Book</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-white text-sm transition">Deselect All</button>
        </div>
      )}
    </div >
  );
}
