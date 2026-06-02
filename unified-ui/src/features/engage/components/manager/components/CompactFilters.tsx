"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, User, Check, X } from 'lucide-react';
import { MOCK_TEAM_MEMBERS } from '../mocks/engage.mock';
import type { GroupByOption, SortOption } from '../types/engage.types';

interface CompactFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  groupBy: GroupByOption;
  onGroupByChange: (option: GroupByOption) => void;
  sortBy: SortOption;
  onSortByChange: (option: SortOption) => void;
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  isManagerView: boolean;
  filterCount: number;
  onFilterClick: () => void;
  onClearFilters: () => void;
}

const sortLabels: Record<SortOption, string> = {
  'due_date': 'Due Date',
  'recent_activity': 'Recent Activity',
  'priority': 'Priority',
};

const groupByLabels: Record<GroupByOption, string> = {
  none: 'None',
  flow: 'Flow',
  step_number: 'Flow Step',
};

function AssigneeSelector({ selectedUserId, onUserChange }: { selectedUserId: string; onUserChange: (userId: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedUser = MOCK_TEAM_MEMBERS.find(u => u.id === selectedUserId) || MOCK_TEAM_MEMBERS[0];

  const filteredUsers = MOCK_TEAM_MEMBERS.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserIndex = filteredUsers.findIndex(u => u.id === 'me');
  const otherUsers = filteredUsers.filter(u => u.id !== 'me');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleUserSelect = (userId: string) => {
    onUserChange(userId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Collapsed State */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        style={{
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          color: '#111827',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '#F9FAFB';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
          }
        }}
      >
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          <User className="w-3 h-3" style={{ color: '#6B7280' }} />
        </div>
        <span>{selectedUser.id === 'me' ? 'Me' : selectedUser.name}</span>
        <ChevronDown
          className="w-4 h-4 transition-transform"
          style={{
            color: '#9CA3AF',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Expanded Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 rounded-md shadow-lg overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            minWidth: '220px',
            maxWidth: '280px',
            zIndex: 9999,
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b" style={{ borderColor: '#E5E7EB' }}>
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: '#9CA3AF' }}
              />
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-sm rounded outline-none"
                style={{
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                  color: '#111827',
                }}
                autoFocus
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-64 overflow-y-auto">
            {/* Current User */}
            {currentUserIndex !== -1 && (
              <>
                <button
                  onClick={() => handleUserSelect('me')}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors"
                  style={{
                    backgroundColor: selectedUserId === 'me' ? '#F3F4F6' : 'transparent',
                    color: '#111827',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUserId !== 'me') {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUserId !== 'me') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#F3F4F6' }}
                    >
                      <User className="w-3 h-3" style={{ color: '#6B7280' }} />
                    </div>
                    <span className="truncate">Me</span>
                  </div>
                  {selectedUserId === 'me' && (
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#4F46E5' }} />
                  )}
                </button>

                {/* Divider */}
                {otherUsers.length > 0 && (
                  <div className="my-1 mx-3" style={{ borderTop: '1px solid #E5E7EB' }} />
                )}
              </>
            )}

            {/* Other Users */}
            {otherUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: selectedUserId === user.id ? '#F3F4F6' : 'transparent',
                  color: '#111827',
                }}
                onMouseEnter={(e) => {
                  if (selectedUserId !== user.id) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserId !== user.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#F3F4F6' }}
                  >
                    <User className="w-3 h-3" style={{ color: '#6B7280' }} />
                  </div>
                  <span className="truncate" title={user.name}>
                    {user.name}
                  </span>
                </div>
                {selectedUserId === user.id && (
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#4F46E5' }} />
                )}
              </button>
            ))}

            {/* No Results */}
            {filteredUsers.length === 0 && (
              <div className="px-3 py-6 text-sm text-center" style={{ color: '#9CA3AF' }}>
                No users found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompactFilters({
  searchQuery,
  onSearchChange,
  groupBy,
  onGroupByChange,
  sortBy,
  onSortByChange,
  selectedUserId,
  onUserChange,
  isManagerView,
  filterCount,
  onFilterClick,
  onClearFilters,
}: CompactFiltersProps) {
  return (
    <div
      className="sticky top-0 z-10 rounded-xl mb-4 border border-gray-200"
      style={{
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Filter Button */}
          <button
            onClick={onFilterClick}
            className="inline-flex items-center justify-center p-2.5 rounded-md text-sm font-medium transition-colors flex-shrink-0 border border-gray-200 bg-white text-gray-900 relative"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <Filter className="w-4 h-4" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                {filterCount}
              </span>
            )}
          </button>

          {/* Search */}
          <div className="flex-1 w-full relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks, contacts, companies..."
              className="w-full pl-9 pr-8 py-2 rounded-md text-sm transition-colors border border-gray-200 outline-none"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#9CA3AF';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            />
            {searchQuery.trim() !== '' && (
              <button
                onClick={onClearFilters}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Group By, Sort By, Assignee */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Group By Dropdown - Hidden */}
            {false && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap text-gray-500">
                  Group By
                </label>
                <div className="relative">
                  <select
                    value={groupBy}
                    onChange={(e) => onGroupByChange(e.target.value as GroupByOption)}
                    className="appearance-none inline-flex items-center gap-1.5 pl-3 pr-8 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border border-gray-200 bg-white text-gray-900 outline-none"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    {(Object.keys(groupByLabels) as GroupByOption[]).map((key) => (
                      <option key={key} value={key}>
                        {groupByLabels[key]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Sort By Dropdown - Hidden */}
            {false && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap text-gray-500">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => onSortByChange(e.target.value as SortOption)}
                    className="appearance-none inline-flex items-center gap-1.5 pl-3 pr-8 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border border-gray-200 bg-white text-gray-900 outline-none"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                      <option key={key} value={key}>
                        {sortLabels[key]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Assignee Selector */}
            {isManagerView && (
              <AssigneeSelector selectedUserId={selectedUserId} onUserChange={onUserChange} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
