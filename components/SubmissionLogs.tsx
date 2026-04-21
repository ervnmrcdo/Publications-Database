import { useState } from 'react';
import { SubmissionLog } from '@/lib/types';

interface SubmissionLogsProps {
    logs: SubmissionLog[];
}

interface GroupedLog {
    action: SubmissionLog['action'];
    actor_name: string;
    logs: SubmissionLog[];
    dateRange: string;
    count: number;
}

function SubmissionLogs({ logs }: SubmissionLogsProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    function getActionColor(action: SubmissionLog['action']) {
        const colors = {
            RETURNED: 'bg-red-900/30 text-red-400',
            SUBMITTED: 'bg-blue-900/30 text-blue-400',
            VALIDATED: 'bg-green-900/30 text-green-400',
            RESUBMITTED: 'bg-yellow-900/30 text-yellow-400',
            DRAFT_CREATED: 'bg-purple-900/30 text-purple-400',
            DRAFT_EDITED: 'bg-orange-900/30 text-orange-400'
        };
        return colors[action];
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleString();
    }

    function formatDateRange(startDate: string, endDate: string): string {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const startDateStr = start.toLocaleDateString();
        const endDateStr = end.toLocaleDateString();
        const startTime = start.toLocaleTimeString();
        const endTime = end.toLocaleTimeString();
        
        if (startDateStr === endDateStr) {
            return `${startDateStr} • ${startTime} - ${endTime}`;
        }
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    function groupLogs(logs: SubmissionLog[]): GroupedLog[] {
        const groups: GroupedLog[] = [];
        
        logs.forEach((log) => {
            const lastGroup = groups[groups.length - 1];
            
            if (lastGroup && 
                lastGroup.action === log.action && 
                lastGroup.actor_name === log.actor_name) {
                lastGroup.logs.push(log);
                lastGroup.count = lastGroup.logs.length;
                lastGroup.dateRange = formatDateRange(
                    lastGroup.logs[0].date, 
                    lastGroup.logs[lastGroup.logs.length - 1].date
                );
            } else {
                groups.push({
                    action: log.action,
                    actor_name: log.actor_name,
                    logs: [log],
                    dateRange: formatDateRange(log.date, log.date),
                    count: 1
                });
            }
        });
        
        return groups;
    }

    function toggleGroup(index: number) {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedGroups(newExpanded);
    }

    if (!logs) {
        return (
            <div className="p-4 text-center text-gray-400">
                No submission logs available
            </div>
        );
    }

    const groupedLogs = groupLogs(logs);

    return (
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 space-y-4 mt-5">
            <h2 className="text-xl font-bold mb-4 text-white">Submission History</h2>

            <div className="space-y-3">
                {groupedLogs.map(function(group, groupIndex) {
                    const isExpanded = expandedGroups.has(groupIndex);
                    
                    if (group.count === 1) {
                        const log = group.logs[0];
                        return (
                            <div
                                key={groupIndex}
                                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(
                                            log.action
                                        )}`}
                                    >
                                        {log.action}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        {formatDate(log.date)}
                                    </span>
                                </div>
                                {log.actor_name && (
                                    <p className="text-gray-300 mt-2 ml-2">{log.actor_name}</p>
                                )}

                                {log.remarks && (
                                    <p className="text-gray-300 mt-2">{log.remarks}</p>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div
                            key={groupIndex}
                            className="border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div 
                                className="p-4 cursor-pointer"
                                onClick={() => toggleGroup(groupIndex)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(
                                                group.action
                                            )}`}
                                        >
                                            {group.action}
                                        </span>
                                        <span className="text-gray-300">
                                            {group.count} {group.count === 1 ? 'edit' : 'edits'} by {group.actor_name}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-400">
                                        {group.dateRange}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <div className="text-sm text-gray-500 mt-1 ml-2">
                                        Click to collapse
                                    </div>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="border-t p-4 space-y-3">
                                    {group.logs.map((log, logIndex) => (
                                        <div key={logIndex} className="ml-4 pl-4 border-l-2 border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 text-sm">
                                                    {formatDate(log.date)}
                                                </span>
                                            </div>
                                            {log.remarks && (
                                                <p className="text-gray-300 mt-1">{log.remarks}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SubmissionLogs;