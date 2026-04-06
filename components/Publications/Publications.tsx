"use client";

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SupabasePublication } from '@/lib/types';

type PublicationType = {
  id: number;
  name: string;
};

export default function Publications() {
  const { user } = useAuth();
  const [publications, setPublications] = useState<SupabasePublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  // const [showForm, setShowForm] = useState(false);
  // const [isEditing, setIsEditing] = useState(false)

  type Mode = "view" | "add" | "edit";
  const [mode, setMode] = useState<Mode>("view");

  const [type, setType] = useState('');
  const [publicationTypeId, setPublicationTypeId] = useState<number | null>(null)
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('');
  const [datePublished, setDatePublished] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [pageNumbers, setPageNumbers] = useState('');
  const [volumeNumber, setVolumeNumber] = useState('');
  const [journalName, setJournalName] = useState('');
  const [doi, setDOI] = useState('');

  const [publicationTypes, setPublicationTypes] = useState<PublicationType[]>([]);

  const [selectedPublication, setSelectedPublication] = useState<SupabasePublication | null>(null);
  const [highlightedPubId, setHighlightedPubId] = useState<number | null>(null)

  const supabase = createClient();

  useEffect(() => {
    fetchPublications();
    fetchPublicationTypes();
  }, [user]);

  const fetchPublicationTypes = async () => {
  try {
    const res = await fetch("/api/admin/publication-types/route");
    if (!res.ok) throw new Error("Failed to fetch types");

    const data = await res.json();
    setPublicationTypes(data);
  } catch (err) {
    console.error(err);
  }
};

  const fetchPublications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('publication_authors')
      .select(`
          publication_id,
          publications (
            publication_id,
            type,
            publication_type_id,
            title,
            publisher,
            publication_status,
            date_published,
            issue_number,
            page_numbers,
            volume_number, 
            journal_name,
            doi
          )
        `)
      .eq('user_id', user.id);

    if (!error && data) {
      const pubs = data
        .map((row: any) => row.publications)
        .filter((pub: any) => !!pub);
      setPublications(pubs);
    }

    setLoading(false);
  };


  function resetForm() {
    setType('')
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
  }

  const addPublication = async () => {
    if (!title.trim() || !publicationTypeId || !user) return;

    setLoading(true);
    const { data: pubData, error: pubError } = await supabase
      .from('publications')
      .insert([
        {
          type,
          publication_type_id: publicationTypeId,
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

    // link publication to current user adding
    const { error: linkError } = await supabase
      .from('publication_authors')
      .insert([
        {
          publication_id: newPub.publication_id,
          user_id: user.id,
        }
      ]);

    if (linkError) {
      setLoading(false);
      alert('Failed to link publication to user.');
      return;
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
          type,
          publication_type_id: publicationTypeId,
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
    <div className="flex-1 overflow-auto bg-[#0f1117] text-gray-300 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700 mt-8">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-white">My Publications</h2>
            <div className="flex flex-wrap items-center gap-2">
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
                value={publicationTypeId ?? ''}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  const selectedPubType = publicationTypes.find(t=>t.id === value);
                  setPublicationTypeId(value)
                  setType(selectedPubType?.name || "")
                }}
                className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600"
              >
                <option value="">Select Type</option>
                {publicationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Publisher" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={doi} onChange={(e) => setDOI(e.target.value)} placeholder="DOI" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="date" value={datePublished} onChange={(e) => setDatePublished(e.target.value)} placeholder="Date Published" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={issueNumber} onChange={(e) => setIssueNumber(e.target.value)} placeholder="Issue Number" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={pageNumbers} onChange={(e) => setPageNumbers(e.target.value)} placeholder="Page Numbers" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={volumeNumber} onChange={(e) => setVolumeNumber(e.target.value)} placeholder="Volume Number" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
              <input type="text" value={journalName} onChange={(e) => setJournalName(e.target.value)} placeholder="Journal Name" className="w-full p-2 rounded bg-[#252836] text-white border border-gray-600" />
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

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : publications.length === 0 ? (
            <p className="text-gray-400">No publications found.</p>
          ) : (
            <ul className="space-y-4">
              {publications.map((pub) => (
                <li
                  key={pub.publication_id}
                  onClick={() => {
                    setSelectedPublication(pub)
                    setMode("view");

                    setType(pub.type || '')
                    setPublicationTypeId(pub.publication_type_id || null)
                    setTitle(pub.title || '')
                    setPublisher(pub.publisher || '')
                    setDOI(pub.doi || '')
                    setDatePublished(pub.date_published || '')
                    setIssueNumber(pub.issue_number || '')
                    setPageNumbers(pub.page_numbers || '')
                    setVolumeNumber(pub.volume_number || '')
                    setJournalName(pub.journal_name || '')
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition
                    ${highlightedPubId === pub.publication_id
                      ? "bg-green-900 border-green-500"
                      : "bg-[#23263a] border-gray-600 hover:border-blue-500"
                    }
                  `}
                >
                  <div className="font-bold text-lg text-white">{pub.title}</div>
                  <div className="text-gray-400 text-sm">
                    Type: {pub.type}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Publisher: {pub.publisher}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {mode === "view" && selectedPublication && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-[#1b1e2b] p-6 rounded-lg w-full max-w-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">
                  {selectedPublication.title}
                </h3>

                <div className="space-y-2 text-gray-300 text-sm">
                  <p><span className="text-gray-400">Type:</span> {selectedPublication.type}</p>
                  <p><span className="text-gray-400">Publisher:</span> {selectedPublication.publisher}</p>
                  <p><span className="text-gray-400">Date Published:</span> {selectedPublication.date_published}</p>
                  <p><span className="text-gray-400">Issue:</span> {selectedPublication.issue_number}</p>
                  <p><span className="text-gray-400">Pages:</span> {selectedPublication.page_numbers}</p>
                  <p><span className="text-gray-400">Volume:</span> {selectedPublication.volume_number}</p>
                  <p><span className="text-gray-400">Journal:</span> {selectedPublication.journal_name}</p>
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
    </div >
  );
}
