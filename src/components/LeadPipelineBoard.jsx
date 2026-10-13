import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Target, Search, Zap, MessageSquare, Flame, Check, Trash2, ShieldCheck, Tag,
  RefreshCw, Radio, Sparkles, Sliders, Eye, X, ChevronLeft, ChevronRight, User,
  Award, ArrowUpRight, CheckCircle2, Globe, Database, Cpu, Terminal, Activity,
  Filter, Ban, Clock, AlertTriangle, Mail
} from 'lucide-react';
import axios from 'axios';
import { CustomSelect } from './CustomSelect';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DmOutreachAgentModal } from './DmOutreachAgentModal';
import { EmailOutreachAgentModal } from './EmailOutreachAgentModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const SUBREDDIT_OPTIONS = [
  { value: 'all', label: '🌐 All Subreddits' },
  { value: 'SaaS', label: 'r/SaaS' },
  { value: 'startups', label: 'r/startups' },
  { value: 'homesecurity', label: 'r/homesecurity' },
  { value: 'Entrepreneur', label: 'r/Entrepreneur' },
  { value: 'smallbusiness', label: 'r/smallbusiness' },
  { value: 'marketing', label: 'r/marketing' },
  { value: 'webdev', label: 'r/webdev' },
];

export const LeadPipelineBoard = () => {
  const [leads, setLeads] = useState([]);
  const [brandDomains, setBrandDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState(false);
  const [is247Active, setIs247Active] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearingBoard, setIsClearingBoard] = useState(false);

  // Status Filter State: 'all' | 'draft' | 'sent' | 'disqualified'
  const [approvalFilter, setApprovalFilter] = useState('all');

  // Search Console Mode State: 'automatic' (Brand Vault Data) vs 'manual' (Custom Search)
  const [searchMode, setSearchMode] = useState('automatic');

  // Manual Search Console State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubreddit, setSelectedSubreddit] = useState('all');
  const [searchTargetDomain, setSearchTargetDomain] = useState('AlertCareLine.com');

  // Pagination & Cards Per Page State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedLeadForModal, setSelectedLeadForModal] = useState(null);
  const [selectedLeadForDmAgent, setSelectedLeadForDmAgent] = useState(null);
  const [selectedLeadForEmailAgent, setSelectedLeadForEmailAgent] = useState(null);
  const [modalDmMode, setModalDmMode] = useState('opener'); // 'opener' | 'brandEmail'
  const [cardDmModeMap, setCardDmModeMap] = useState({}); // { [leadId]: 'opener' | 'brandEmail' }
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'grid'
  const [sendingViaRedditSession, setSendingViaRedditSession] = useState(false);

  // Live Extraction Sweep Flowchart Modal State
  const [sweepModalState, setSweepModalState] = useState({
    isOpen: false,
    activeTab: 'flowchart', // 'flowchart' | 'audit'
    auditFilter: 'all', // 'all' | 'selected' | 'rejected'
    currentStep: 1, // 1: Prowlo, 2: OpenAI 3D, 3: Telemetry Audit, 4: Insertion Complete
    statusText: '',
    logs: [],
    addedCount: 0,
    subName: '',
    domainName: '',
    auditItems: [],
    isComplete: false,
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('pulsered_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchLeadsAndBrands = async () => {
    setLoading(true);
    try {
      const [leadsRes, brandsRes, sweeperRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/agent/leads`, getAuthHeader()),
        axios.get(`${API_BASE_URL}/brand-domains`, getAuthHeader()),
        axios.get(`${API_BASE_URL}/agent/sweep/status`, getAuthHeader()),
      ]);

      const fetchedBrands = brandsRes.data?.domains || [];
      setLeads(leadsRes.data?.leads || []);
      setBrandDomains(fetchedBrands);
      if (fetchedBrands.length > 0 && !searchTargetDomain) {
        setSearchTargetDomain(fetchedBrands[0].domainUrl);
      }
      setIs247Active(sweeperRes.data?.status?.isSweepingActive || false);
    } catch (err) {
      console.error('Failed to fetch lead pipeline or brand domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndBrands();
  }, []);

  const showToast = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Active Brand Object & Brand Options
  const activeBrandObj = useMemo(() => {
    return brandDomains.find(b => b.domainUrl === searchTargetDomain) || brandDomains[0];
  }, [brandDomains, searchTargetDomain]);

  const brandSelectOptions = useMemo(() => {
    const list = [{ value: 'all', label: '🌐 All Brand Domains' }];
    if (brandDomains.length > 0) {
      brandDomains.forEach(b => {
        list.push({
          value: b.domainUrl,
          label: b.brandName ? `${b.brandName} (${b.domainUrl})` : b.domainUrl,
        });
      });
    } else {
      list.push(
        { value: 'AlertCareLine.com', label: 'Alert Care Line (AlertCareLine.com)' },
        { value: 'OneUpOutreach.com', label: 'OneUp Outreach (OneUpOutreach.com)' }
      );
    }
    return list;
  }, [brandDomains]);

  // Dynamic Suggested Keyword Pills
  const suggestedKeywordPills = useMemo(() => {
    if (activeBrandObj && Array.isArray(activeBrandObj.targetKeywords) && activeBrandObj.targetKeywords.length > 0) {
      return activeBrandObj.targetKeywords.map(k => ({
        label: k,
        subreddit: (activeBrandObj.targetSubreddits && activeBrandObj.targetSubreddits[0]) || 'homesecurity',
      }));
    }
    const isAlertCare = !activeBrandObj || (searchTargetDomain && (searchTargetDomain.toLowerCase().includes('alertcareline') || searchTargetDomain.toLowerCase().includes('alertcardline')));
    if (isAlertCare) {
      return [
        { label: 'affordable security cameras homeowners', subreddit: 'homesecurity' },
        { label: 'home security system compare', subreddit: 'homesecurity' },
        { label: 'home security for new homeowner', subreddit: 'homesecurity' },
        { label: 'wireless doorbell', subreddit: 'homesecurity' },
        { label: 'someone broke into my car', subreddit: 'homesecurity' },
        { label: 'cheapest home security system for home', subreddit: 'homesecurity' },
        { label: 'adt alternatives', subreddit: 'homesecurity' },
        { label: 'neighborhood break-in', subreddit: 'homesecurity' },
        { label: 'best security system for my home', subreddit: 'homesecurity' },
        { label: 'ring doorbell not working', subreddit: 'homesecurity' },
      ];
    }
    const pills = [];
    if (Array.isArray(activeBrandObj.targetSubreddits)) {
      activeBrandObj.targetSubreddits.forEach(sub => {
        pills.push({ label: `looking for ${sub} software tool`, subreddit: sub });
      });
    }
    if (activeBrandObj.specialization) {
      const specWords = activeBrandObj.specialization.split(',').map(s => s.trim()).filter(Boolean);
      specWords.slice(0, 2).forEach(w => {
        pills.push({ label: `best ${w.substring(0, 30)}`, subreddit: 'all' });
      });
    }
    pills.push({ label: 'recommendation for software solution', subreddit: 'all' });
    return pills.slice(0, 10);
  }, [activeBrandObj, searchTargetDomain]);

  const handleSelectKeywordPill = (pill) => {
    setSearchQuery(pill.label);
    if (pill.subreddit && pill.subreddit !== 'all') {
      setSelectedSubreddit(pill.subreddit);
    }
    showToast(`✨ Selected Brand Keyword: "${pill.label}"`);
  };

  const handleClearBoard = () => {
    setShowClearConfirmModal(true);
  };

  const handleConfirmClearBoard = async () => {
    setIsClearingBoard(true);
    try {
      await axios.delete(`${API_BASE_URL}/agent/leads/clear-all`, getAuthHeader());
      setLeads([]);
      setShowClearConfirmModal(false);
      showToast('🗑️ Lead Pipeline Board cleared.');
    } catch (err) {
      console.error('Failed to clear board:', err);
      showToast('⚠️ Failed to clear pipeline board');
    } finally {
      setIsClearingBoard(false);
    }
  };

  const executeSweepWithModal = async (sub, domain, query) => {
    const targetSubName = sub !== 'all' ? `r/${sub}` : 'All Subreddits';
    const targetDomainName = domain !== 'all' ? domain : 'AlertCareLine.com';
    const activeKeyword = (query && query.trim()) || (activeBrandObj?.targetKeywords?.[0]) || 'affordable security cameras homeowners';
    const queryTerm = `"${activeKeyword}"`;

    setSweepModalState({
      isOpen: true,
      activeTab: 'flowchart',
      auditFilter: 'all',
      currentStep: 1,
      progressPct: 25,
      statusText: `Step 1/4: Querying Prowlo & RedditAPIs for keyword ${queryTerm} on ${targetSubName}... (25%)`,
      logs: [
        `[${new Date().toLocaleTimeString()}] 🚀 Initiating Live Lead Extraction Pipeline for ${targetDomainName}`,
        `[${new Date().toLocaleTimeString()}] 🎯 Active Search Keyword: ${queryTerm}`,
        `[${new Date().toLocaleTimeString()}] 🌐 Target Subreddit Filter: ${targetSubName}`,
        `[${new Date().toLocaleTimeString()}] 📡 Connecting to Prowlo Engine API (Mode: Semantic, Sort: Recent)...`,
      ],
      addedCount: 0,
      subName: targetSubName,
      domainName: targetDomainName,
      auditItems: [],
      isComplete: false,
    });
    setSweeping(true);

    const stepTimer1 = setTimeout(() => {
      setSweepModalState(prev => ({
        ...prev,
        currentStep: 2,
        progressPct: 50,
        statusText: `Step 2/4: OpenAI (GPT-4o mini) scoring buyer intent for ${queryTerm}... (50%)`,
        logs: [
          ...prev.logs,
          `[${new Date().toLocaleTimeString()}] 📥 Prowlo API returned live discussion threads & comment stream for ${queryTerm}`,
          `[${new Date().toLocaleTimeString()}] 🧠 OpenAI AI evaluating 3D intent scores, pain points & fit for ${targetDomainName}`,
        ],
      }));
    }, 850);

    const stepTimer2 = setTimeout(() => {
      setSweepModalState(prev => ({
        ...prev,
        currentStep: 3,
        progressPct: 75,
        statusText: `Step 3/4: Auditing prospect trust telemetry for ${queryTerm}... (75%)`,
        logs: [
          ...prev.logs,
          `[${new Date().toLocaleTimeString()}] 🛡️ Validating Reddit user trust metrics (Karma, Account Age & Spam Risk)`,
          `[${new Date().toLocaleTimeString()}] ✨ Drafting tailored DM outreach openers for ${targetDomainName}`,
        ],
      }));
    }, 1700);

    try {
      const payload = {
        searchQuery: query && query.trim() ? query.trim() : activeKeyword,
        customSubreddit: sub !== 'all' ? sub : null,
        targetDomain: targetDomainName,
      };

      const res = await axios.post(`${API_BASE_URL}/agent/sweep/run-single`, payload, getAuthHeader());
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const sweepInfo = res.data?.sweepResult;
      const addedCount = sweepInfo?.leadsAdded || 0;
      const auditItems = sweepInfo?.auditItems || [];
      const searchedKw = sweepInfo?.keyword || activeKeyword;

      setSweepModalState(prev => ({
        ...prev,
        currentStep: 4,
        progressPct: 100,
        statusText: `Step 4/4: Complete! Evaluated ${auditItems.length} items for "${searchedKw}", extracted ${addedCount} target buyers (100%).`,
        addedCount,
        auditItems,
        isComplete: true,
        logs: [
          ...prev.logs,
          `[${new Date().toLocaleTimeString()}] 🎯 Search Keyword Used: "${searchedKw}"`,
          `[${new Date().toLocaleTimeString()}] 📊 Evaluated ${auditItems.length} discussions & comments (${auditItems.filter(i => i.status === 'SELECTED').length} Qualified / ${auditItems.filter(i => i.status === 'REJECTED').length} Filtered Out)`,
          `[${new Date().toLocaleTimeString()}] 🏆 New Qualified Buyers Inserted: ${addedCount} leads for ${targetDomainName}`,
          `[${new Date().toLocaleTimeString()}] 📋 Evaluated items audit feed ready for review.`,
        ],
      }));

      setCurrentPage(1);
      await fetchLeadsAndBrands();
      showToast(`🎯 Extracted ${addedCount} new buyers for ${targetDomainName} (Keyword: "${searchedKw}")!`);
    } catch (err) {
      console.error('Error during live sweep:', err);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setSweepModalState(prev => ({
        ...prev,
        isComplete: true,
        statusText: '❌ Extraction encountered an error. Please check server connection.',
        logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ❌ Failed to complete sweep: ${err.message}`],
      }));
    } finally {
      setSweeping(false);
    }
  };

  const executeBatchSweepAllKeywords = async () => {
    const keywordsList = (activeBrandObj && Array.isArray(activeBrandObj.targetKeywords) && activeBrandObj.targetKeywords.length > 0)
      ? activeBrandObj.targetKeywords
      : suggestedKeywordPills.map(p => p.label);

    const targetSubName = selectedSubreddit !== 'all' ? `r/${selectedSubreddit}` : 'All Subreddits';
    const targetDomainName = searchTargetDomain !== 'all' ? searchTargetDomain : 'AlertCareLine.com';

    setSweepModalState({
      isOpen: true,
      activeTab: 'flowchart',
      auditFilter: 'all',
      currentStep: 1,
      progressPct: 15,
      statusText: `Step 1/4: Querying Prowlo & RedditAPIs in parallel across ${keywordsList.length} keywords... (15%)`,
      logs: [
        `[${new Date().toLocaleTimeString()}] ⚡ Initiating Parallel Multi-Keyword Batch Sweep (${keywordsList.length} Keywords)`,
        `[${new Date().toLocaleTimeString()}] 🏷️ Target Brand: ${targetDomainName}`,
        `[${new Date().toLocaleTimeString()}] 🌐 Target Subreddit Filter: ${targetSubName}`,
        `[${new Date().toLocaleTimeString()}] 🚀 Triggering High-Speed Concurrent Backend Engine (Chunks of 3)...`,
      ],
      addedCount: 0,
      subName: targetSubName,
      domainName: targetDomainName,
      auditItems: [],
      isComplete: false,
    });
    setSweeping(true);

    const stepTimer1 = setTimeout(() => {
      setSweepModalState(prev => ({
        ...prev,
        currentStep: 2,
        progressPct: 45,
        statusText: `Step 2/4: OpenAI AI 3D intent scoring across concurrent streams... (45%)`,
        logs: [
          ...prev.logs,
          `[${new Date().toLocaleTimeString()}] 📥 Prowlo & RedditAPIs stream fetched for all ${keywordsList.length} keywords`,
          `[${new Date().toLocaleTimeString()}] 🧠 OpenAI (GPT-4o mini) evaluating pain points, fit & commercial intent...`,
        ],
      }));
    }, 850);

    const stepTimer2 = setTimeout(() => {
      setSweepModalState(prev => ({
        ...prev,
        currentStep: 3,
        progressPct: 75,
        statusText: `Step 3/4: Auditing prospect trust telemetry & drafting openers... (75%)`,
        logs: [
          ...prev.logs,
          `[${new Date().toLocaleTimeString()}] 🛡️ Validating Reddit user trust metrics & deduplicating leads`,
          `[${new Date().toLocaleTimeString()}] ✨ Drafting tailored DM outreach openers for ${targetDomainName}`,
        ],
      }));
    }, 1700);

    try {
      const payload = {
        targetDomain: targetDomainName,
        customSubreddit: selectedSubreddit !== 'all' ? selectedSubreddit : null,
      };

      const res = await axios.post(`${API_BASE_URL}/agent/sweep/run-all-keywords`, payload, getAuthHeader());
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const batchResult = res.data?.batchResult;
      const totalAdded = batchResult?.totalLeadsAdded || 0;
      const batchList = batchResult?.batchResults || [];
      const allAuditItems = batchList.flatMap(r => r.auditItems || []);

      const resultLogs = [
        `[${new Date().toLocaleTimeString()}] ⚡ High-Speed Engine completed scanning ${batchResult?.keywordsScanned || keywordsList.length} keywords in parallel chunks!`,
      ];
      batchList.forEach((r, idx) => {
        resultLogs.push(
          `[${new Date().toLocaleTimeString()}]   ✓ [Keyword ${idx + 1}/${batchList.length}] "${r.keyword}": Evaluated ${r.evaluated || 0} items, found ${r.leadsAdded || 0} qualified buyers.`
        );
      });
      resultLogs.push(
        `[${new Date().toLocaleTimeString()}] 🏆 Batch Sweep Complete! Extracted ${totalAdded} target buyers across ${allAuditItems.length} total evaluated items.`,
        `[${new Date().toLocaleTimeString()}] 📋 Full audit feed ready in "Evaluated Items Feed" tab.`
      );

      setSweepModalState(prev => ({
        ...prev,
        currentStep: 4,
        progressPct: 100,
        statusText: `Step 4/4: Complete! Scanned ${keywordsList.length} keywords in parallel. Extracted ${totalAdded} target buyers (100%).`,
        addedCount: totalAdded,
        auditItems: allAuditItems,
        isComplete: true,
        logs: [...prev.logs, ...resultLogs],
      }));

      setCurrentPage(1);
      await fetchLeadsAndBrands();
      showToast(`⚡ Multi-Keyword Batch Sweep Complete! Extracted ${totalAdded} buyers across ${keywordsList.length} keywords in parallel.`);
    } catch (err) {
      console.error('Error during parallel batch sweep:', err);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setSweepModalState(prev => ({
        ...prev,
        isComplete: true,
        statusText: '❌ Batch Extraction encountered an error. Please check server connection.',
        logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ❌ Failed to complete batch sweep: ${err.message}`],
      }));
    } finally {
      setSweeping(false);
    }
  };

  const handleDomainDropdownChange = async (newDomain) => {
    setSearchTargetDomain(newDomain);
    
    let targetSub = 'all';
    if (newDomain !== 'all') {
      const matchingBrand = brandDomains.find(b => b.domainUrl === newDomain);
      if (matchingBrand && Array.isArray(matchingBrand.targetSubreddits) && matchingBrand.targetSubreddits.length > 0) {
        targetSub = matchingBrand.targetSubreddits[0];
      }
    }
    setSelectedSubreddit(targetSub);
    executeSweepWithModal(targetSub, newDomain, searchQuery);
  };

  const handleManualSearch = async (e) => {
    if (e) e.preventDefault();
    executeSweepWithModal(selectedSubreddit, searchTargetDomain, searchQuery);
  };

  const handleToggle247Sweeper = async () => {
    try {
      if (is247Active) {
        await axios.post(`${API_BASE_URL}/agent/sweep/stop`, {}, getAuthHeader());
        setIs247Active(false);
        showToast('⏸️ 24/7 Rotational Sweeper Paused');
      } else {
        await axios.post(`${API_BASE_URL}/agent/sweep/start`, { intervalMs: 60000 }, getAuthHeader());
        setIs247Active(true);
        showToast('🚀 24/7 Rotational Sweeper Activated!');
      }
    } catch (err) {
      console.error('Error toggling sweeper:', err);
    }
  };

  const handleBrandDomainChange = async (leadId, newDomain) => {
    try {
      await axios.patch(`${API_BASE_URL}/agent/leads/${leadId}/brand-domain`, { targetDomain: newDomain }, getAuthHeader());
      setLeads(prev => prev.map(l => (l._id === leadId || l.id === leadId ? { ...l, targetDomain: newDomain } : l)));
      if (selectedLeadForModal && (selectedLeadForModal._id === leadId || selectedLeadForModal.id === leadId)) {
        setSelectedLeadForModal(prev => ({ ...prev, targetDomain: newDomain }));
      }
      showToast(`🏷️ Reassigned brand to ${newDomain}`);
    } catch (err) {
      console.error('Failed to change brand domain:', err);
    }
  };

  const handleApproveDM = async (leadId, customContent = null) => {
    try {
      const payload = customContent ? { editedContent: customContent } : {};
      const res = await axios.post(`${API_BASE_URL}/agent/leads/${leadId}/approve-send`, payload, getAuthHeader());
      setLeads(prev => prev.map(l => (l._id === leadId || l.id === leadId ? { ...l, approvalStatus: 'sent', stage: 'Engaged', sentMessage: res.data?.lead?.sentMessage || customContent || l.openerDraft?.content } : l)));
      if (selectedLeadForModal && (selectedLeadForModal._id === leadId || selectedLeadForModal.id === leadId)) {
        setSelectedLeadForModal(prev => ({ ...prev, approvalStatus: 'sent', stage: 'Engaged', sentMessage: res.data?.lead?.sentMessage || customContent || prev.openerDraft?.content }));
      }
      showToast(res.data?.message || '✅ DM approved and scheduled for human-paced delivery!');
    } catch (err) {
      console.error('Error approving DM:', err);
    }
  };

  const handleDisqualify = async (leadId) => {
    try {
      // Mark as disqualified locally so it can be filtered or removed
      setLeads(prev => prev.map(l => (l._id === leadId || l.id === leadId ? { ...l, approvalStatus: 'disqualified' } : l)));
      if (selectedLeadForModal && (selectedLeadForModal._id === leadId || selectedLeadForModal.id === leadId)) {
        setSelectedLeadForModal(prev => ({ ...prev, approvalStatus: 'disqualified' }));
      }
      showToast('🚫 Lead marked as Disqualified / Rejected');
    } catch (err) {
      console.error('Error disqualifying lead:', err);
    }
  };

  const handleHardDelete = async (leadId) => {
    try {
      await axios.delete(`${API_BASE_URL}/agent/leads/${leadId}`, getAuthHeader());
      setLeads(prev => prev.filter(l => l._id !== leadId && l.id !== leadId));
      if (selectedLeadForModal && (selectedLeadForModal._id === leadId || selectedLeadForModal.id === leadId)) {
        setSelectedLeadForModal(null);
      }
      showToast('🗑️ Lead deleted from database');
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  // 5-Stage Kanban Definition
  const KANBAN_STAGES = [
    { id: 'New Leads', title: 'New Leads', icon: '📥', color: '#6366f1', border: 'rgba(99, 102, 241, 0.35)', bg: 'rgba(99, 102, 241, 0.08)' },
    { id: 'Qualified', title: 'Qualified', icon: '🎯', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.35)', bg: 'rgba(59, 130, 246, 0.08)' },
    { id: 'Outreach Drafted', title: 'Outreach Drafted', icon: '✍️', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.35)', bg: 'rgba(245, 158, 11, 0.08)' },
    { id: 'Engaged / Replied', title: 'Engaged / Replied', icon: '💬', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.35)', bg: 'rgba(139, 92, 246, 0.08)' },
    { id: 'Converted / Closed', title: 'Converted / Closed', icon: '🏆', color: '#10b981', border: 'rgba(16, 185, 129, 0.35)', bg: 'rgba(16, 185, 129, 0.08)' },
  ];

  const normalizeLeadStage = (lead) => {
    const s = lead?.stage;
    if (s === 'Qualified') return 'Qualified';
    if (s === 'Outreach Drafted') return 'Outreach Drafted';
    if (s === 'Engaged / Replied' || s === 'Engaged') return 'Engaged / Replied';
    if (s === 'Converted / Closed' || s === 'Trial' || s === 'Paid') return 'Converted / Closed';
    return 'New Leads';
  };

  const handleMoveStage = async (leadId, targetStage) => {
    try {
      await axios.patch(`${API_BASE_URL}/agent/leads/${leadId}/stage`, { stage: targetStage }, getAuthHeader());
      setLeads((prev) =>
        prev.map((l) => ((l._id || l.id) === leadId ? { ...l, stage: targetStage } : l))
      );
      if (selectedLeadForModal && (selectedLeadForModal._id === leadId || selectedLeadForModal.id === leadId)) {
        setSelectedLeadForModal((prev) => ({ ...prev, stage: targetStage }));
      }
      showToast(`Lead advanced to "${targetStage}" stage!`);
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleSendDirectRedditDm = async (lead) => {
    const leadId = lead._id || lead.id;
    const toUser = lead.author;
    const msgContent = modalDmMode === 'brandEmail'
      ? (lead.brandEmailDmDraft?.content || `Hey u/${lead.author}, saw your discussion...`)
      : (lead.openerDraft?.content || `Hey u/${lead.author}, saw your post...`);

    setSendingViaRedditSession(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/reddit-account/send-dm`,
        {
          to: toUser,
          subject: `Re: ${lead.postTitle?.substring(0, 50) || 'Your Reddit discussion'}`,
          text: msgContent,
        },
        getAuthHeader()
      );

      if (res.data?.success) {
        await axios.patch(
          `${API_BASE_URL}/agent/leads/${leadId}/approval`,
          { approvalStatus: 'sent', sentMessage: msgContent },
          getAuthHeader()
        );
        await handleMoveStage(leadId, 'Engaged / Replied');
        setLeads((prev) =>
          prev.map((l) =>
            (l._id || l.id) === leadId ? { ...l, approvalStatus: 'sent', stage: 'Engaged / Replied' } : l
          )
        );
        showToast(`🚀 DM sent directly to u/${toUser} via active Reddit session!`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      showToast(`Notice: ${errMsg}`);
    } finally {
      setSendingViaRedditSession(false);
    }
  };

  const handlePostRedditThreadComment = async (lead) => {
    const leadId = lead._id || lead.id;
    const thingId = lead.commentId || lead.postId;
    const msgContent = lead.openerDraft?.content || `Hey u/${lead.author}, curious how you are approaching this?`;

    setSendingViaRedditSession(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/reddit-account/submit-comment`,
        {
          thingId,
          text: msgContent,
        },
        getAuthHeader()
      );

      if (res.data?.success) {
        await axios.patch(
          `${API_BASE_URL}/agent/leads/${leadId}/approval`,
          { approvalStatus: 'sent', sentMessage: msgContent },
          getAuthHeader()
        );
        await handleMoveStage(leadId, 'Engaged / Replied');
        setLeads((prev) =>
          prev.map((l) =>
            (l._id || l.id) === leadId ? { ...l, approvalStatus: 'sent', stage: 'Engaged / Replied' } : l
          )
        );
        showToast(`💬 Comment posted directly to Reddit thread via active session!`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      showToast(`Notice: ${errMsg}`);
    } finally {
      setSendingViaRedditSession(false);
    }
  };

  // Status Badge Counters
  const countAll = leads.length;
  const countDrafts = leads.filter(l => !l.approvalStatus || l.approvalStatus === 'draft').length;
  const countSent = leads.filter(l => l.approvalStatus === 'sent').length;
  const countDisqualified = leads.filter(l => l.approvalStatus === 'disqualified').length;

  // Filtered Leads Stream based on Active Domain, Subreddit, and Approval Status
  const displayLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchDomain = !searchTargetDomain || searchTargetDomain === 'all' || lead.targetDomain === searchTargetDomain;
      const matchSub = !selectedSubreddit || selectedSubreddit === 'all' || (lead.subreddit && lead.subreddit.toLowerCase().includes(selectedSubreddit.toLowerCase()));
      const status = lead.approvalStatus || 'draft';
      const matchStatus = approvalFilter === 'all' || status === approvalFilter;
      return matchDomain && matchSub && matchStatus;
    });
  }, [leads, searchTargetDomain, selectedSubreddit, approvalFilter]);

  // Pagination Logic with Dynamic Cards Per Page
  const totalPages = Math.ceil(displayLeads.length / itemsPerPage) || 1;
  const paginatedLeads = displayLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const postAuthorCount = displayLeads.filter(l => l.leadOrigin === 'post_author' || !l.leadOrigin).length;
  const commenterCount = displayLeads.filter(l => l.leadOrigin === 'thread_commenter').length;
  const uniqueAuthors = Array.from(new Set(displayLeads.map(l => l.author).filter(Boolean)));

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '48px' }}>
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--accent-primary)',
            color: 'var(--text-primary)',
            padding: '14px 22px',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
        >
          <Sparkles size={18} color="var(--accent-primary)" />
          {actionSuccessMsg}
        </div>
      )}

      {/* EXECUTIVE TOP HEADER BANNER */}
      <div className="glass-card" style={{ padding: '24px 28px', borderRadius: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <Target size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Workspace
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="status-dot status-dot-active" style={{ backgroundColor: '#34d399' }} />
                  Active Pipeline
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '3px' }}>
                Discovers high-intent Reddit discussions, extracts prospective buyers looking for your product, and drafts personalized outreach messages for approval.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 INFORMATION PILLARS CARD */}
      <div
        className="glass-card"
        style={{
          padding: '24px 28px',
          borderRadius: '24px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div
            style={{
              background: 'var(--card-inner-bg)',
              border: '1px solid var(--glass-border)',
              padding: '20px',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Search size={18} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                1. Find Buyers
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Scans posts and comments across subreddits for people asking for recommendations or experiencing problems your product solves.
            </p>
          </div>

          <div
            style={{
              background: 'var(--card-inner-bg)',
              border: '1px solid var(--glass-border)',
              padding: '20px',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <Zap size={18} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                2. Score Interest
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Evaluates how closely each person's problem matches your offering and how urgently they are looking for a solution.
            </p>
          </div>

          <div
            style={{
              background: 'var(--card-inner-bg)',
              border: '1px solid var(--glass-border)',
              padding: '20px',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <MessageSquare size={18} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                3. Draft Messages
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Prepares helpful, non-spammy outreach responses tailored to each buyer so you can review before sending.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH CONSOLE CARD WITH AUTOMATIC VS MANUAL MODE TOGGLE */}
      <div
        className="glass-card animate-fade-in"
        style={{
          padding: '24px 28px',
          borderRadius: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Top Header & Segmented Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--accent-gradient)', color: '#ffffff', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)' }}>
              {searchMode === 'automatic' ? <Zap size={20} color="#fbbf24" /> : <Sliders size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {searchMode === 'automatic' ? 'Automatic Brand Strategy Console' : 'Manual Keyword Search Console'}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    background: searchMode === 'automatic' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                    color: searchMode === 'automatic' ? 'var(--accent-primary)' : '#fbbf24',
                    border: searchMode === 'automatic' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  {searchMode === 'automatic' ? '⚡ Brand Vault Data Active' : '🛠️ Manual Input'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {searchMode === 'automatic'
                  ? `Uses configured Brand Vault data for ${searchTargetDomain} to automatically scan target subreddits & keywords.`
                  : 'Trigger custom search queries or manually select subreddits and keywords.'}
              </p>
            </div>
          </div>

          {/* Segmented Toggle Control */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'var(--card-inner-bg)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)',
            }}
          >
            <button
              type="button"
              onClick={() => setSearchMode('automatic')}
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: '800',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                background: searchMode === 'automatic' ? 'var(--accent-gradient)' : 'transparent',
                color: searchMode === 'automatic' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: searchMode === 'automatic' ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.25s ease',
              }}
            >
              <Zap size={14} color={searchMode === 'automatic' ? '#fbbf24' : 'currentColor'} /> Automatic Mode
            </button>

            <button
              type="button"
              onClick={() => setSearchMode('manual')}
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: '800',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                background: searchMode === 'manual' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: searchMode === 'manual' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: searchMode === 'manual' ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.25s ease',
              }}
            >
              <Sliders size={14} /> Manual Search
            </button>
          </div>
        </div>

        {/* AUTOMATIC MODE CONSOLE (USES BRAND VAULT DATA) */}
        {searchMode === 'automatic' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Active Brand Domain Selector & Quick Stats */}
            <div
              style={{
                background: 'var(--card-inner-bg)',
                padding: '16px 20px',
                borderRadius: '18px',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.83rem', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  Target Brand Domain:
                </span>
                <CustomSelect
                  options={brandSelectOptions}
                  value={searchTargetDomain}
                  onChange={handleDomainDropdownChange}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: '700', padding: '4px 10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  🌐 {activeBrandObj?.brandName || searchTargetDomain}
                </span>
                <span style={{ fontSize: '0.76rem', fontWeight: '700', padding: '4px 10px', borderRadius: '10px', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', border: '1px solid var(--accent-emerald-border)' }}>
                  🔍 {activeBrandObj?.targetKeywords?.length || 5} Intent Keywords
                </span>
                <span style={{ fontSize: '0.76rem', fontWeight: '700', padding: '4px 10px', borderRadius: '10px', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber-border)' }}>
                  r/ {(activeBrandObj?.targetSubreddits?.length) || 4} Target Subreddits
                </span>
              </div>
            </div>

            {/* Brand Vault Strategy Blueprint Snapshot */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                padding: '18px 20px',
                borderRadius: '18px',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--accent-primary)" /> ACTIVE BRAND VAULT STRATEGY BLUEPRINT
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Configured in Brand Vault • Ready for 1-Click Sweep
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {/* Target Subreddits */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--accent-amber)', display: 'block', marginBottom: '6px' }}>
                    TARGET SUBREDDITS:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {((activeBrandObj?.targetSubreddits) || ['homesecurity', 'homeautomation', 'SaaS']).map((sub, i) => (
                      <span key={i} style={{ fontSize: '0.73rem', fontWeight: '700', padding: '3px 9px', borderRadius: '8px', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber-border)' }}>
                        r/{sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Target High-Intent Keywords */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
                    TARGET BUYER KEYWORDS:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {((activeBrandObj?.targetKeywords) || ['affordable security cameras homeowners', 'adt alternatives']).slice(0, 4).map((kw, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        🔍 {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={executeBatchSweepAllKeywords}
                disabled={sweeping}
                className="glass-button"
                style={{
                  flex: '1 1 280px',
                  height: '46px',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  borderRadius: '14px',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Zap size={18} className={sweeping ? 'spin-animation' : ''} color="#fbbf24" />
                {sweeping ? 'Running Automatic Brand Sweep...' : `⚡ Run Automatic Strategy Sweep for ${activeBrandObj?.brandName || searchTargetDomain}`}
              </button>

              <button
                type="button"
                onClick={handleClearBoard}
                className="glass-button-secondary"
                style={{ height: '46px', padding: '0 18px', borderRadius: '14px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Clear all cards from the board"
              >
                <Trash2 size={16} /> Clear Board
              </button>
            </div>
          </div>
        ) : (
          /* MANUAL MODE CONSOLE (CUSTOM SEARCH & FILTERS) */
          <form onSubmit={handleManualSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
                <input
                  type="text"
                  className="glass-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter custom search phrase or click a Brand Keyword below..."
                  style={{ width: '100%', paddingLeft: '44px', fontSize: '0.88rem', height: '42px', borderRadius: '12px' }}
                />
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              {/* Subreddit Filter Custom Select */}
              <CustomSelect
                options={SUBREDDIT_OPTIONS}
                value={selectedSubreddit}
                onChange={setSelectedSubreddit}
              />

              {/* Brand Domain Filter Custom Select */}
              <CustomSelect
                options={brandSelectOptions}
                value={searchTargetDomain}
                onChange={handleDomainDropdownChange}
              />

              <button
                type="submit"
                disabled={sweeping}
                className="glass-button"
                style={{ height: '42px', padding: '0 18px', borderRadius: '12px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}
              >
                <RefreshCw size={16} className={sweeping ? 'spin-animation' : ''} />
                {sweeping ? 'Searching...' : 'Search & Extract Buyers'}
              </button>

              <button
                type="button"
                onClick={executeBatchSweepAllKeywords}
                disabled={sweeping}
                className="glass-button"
                style={{
                  height: '42px',
                  padding: '0 20px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                  background: 'var(--accent-amber-bg)',
                  border: '1px solid var(--accent-amber-border)',
                  color: 'var(--accent-amber)',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                title={`Run sequential live crawl across all ${suggestedKeywordPills.length} target keywords`}
              >
                <Zap size={16} className={sweeping ? 'spin-animation' : ''} color="var(--accent-amber)" />
                {sweeping ? 'Scanning Batch...' : `⚡ Batch Sweep All ${suggestedKeywordPills.length} Keywords`}
              </button>

              <button
                type="button"
                onClick={handleClearBoard}
                className="glass-button-secondary"
                style={{ height: '42px', padding: '0 14px', borderRadius: '12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                title="Clear all cards from the board"
              >
                <Trash2 size={16} /> Clear Board
              </button>
            </div>

            {/* CLICKABLE BRAND VAULT SUGGESTED KEYWORD PILLS */}
            <div style={{ marginTop: '8px', paddingTop: '14px', borderTop: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} color="var(--accent-primary)" /> Auto-Keywords for {searchTargetDomain}:
              </span>
              {suggestedKeywordPills.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectKeywordPill(pill)}
                  style={{
                    background: 'var(--card-inner-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '5px 12px',
                    fontSize: '0.76rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  💡 "{pill.label}"
                </button>
              ))}
            </div>
          </form>
        )}
      </div>

      {/* METRIC SUMMARY CARDS STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Total Targetable Buyers</span>
            <Flame size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '6px', color: 'var(--text-primary)' }}>
            {leads.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Post Authors</span>
            <User size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '6px', color: 'var(--accent-primary)' }}>
            {postAuthorCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Thread Commenters</span>
            <MessageSquare size={18} color="#14b8a6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '6px', color: '#14b8a6' }}>
            {commenterCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Target Username Stream</span>
            <Award size={18} color="#34d399" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {uniqueAuthors.slice(0, 3).map((uname) => (
              <span
                key={uname}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: 'var(--card-inner-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                }}
              >
                u/{uname}
              </span>
            ))}
            {uniqueAuthors.length > 3 && (
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                +{uniqueAuthors.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* APPROVAL & REJECTION STATUS FILTER CONTROL BAR */}
      <div
        className="glass-card"
        style={{
          padding: '16px 24px',
          borderRadius: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Pipeline Decision Stream:
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setApprovalFilter('all'); setCurrentPage(1); }}
            style={{
              padding: '7px 16px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: approvalFilter === 'all' ? 'var(--accent-gradient)' : 'var(--card-inner-bg)',
              color: approvalFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
              border: approvalFilter === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Globe size={14} /> All Buyers ({countAll})
          </button>

          <button
            type="button"
            onClick={() => { setApprovalFilter('draft'); setCurrentPage(1); }}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: approvalFilter === 'draft' ? 'var(--accent-amber-bg)' : 'var(--card-inner-bg)',
              color: approvalFilter === 'draft' ? 'var(--accent-amber)' : 'var(--text-secondary)',
              border: approvalFilter === 'draft' ? '1px solid var(--accent-amber-border)' : '1px solid var(--glass-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Clock size={14} color="var(--accent-amber)" /> Pending Drafts ({countDrafts})
          </button>

          <button
            type="button"
            onClick={() => { setApprovalFilter('sent'); setCurrentPage(1); }}
            style={{
              padding: '7px 16px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: approvalFilter === 'sent' ? 'rgba(16, 185, 129, 0.2)' : 'var(--card-inner-bg)',
              color: approvalFilter === 'sent' ? '#34d399' : 'var(--text-secondary)',
              border: approvalFilter === 'sent' ? '1px solid #10b981' : '1px solid var(--glass-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 size={14} color="#34d399" /> Approved & Sent ({countSent})
          </button>

          <button
            type="button"
            onClick={() => { setApprovalFilter('disqualified'); setCurrentPage(1); }}
            style={{
              padding: '7px 16px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: approvalFilter === 'disqualified' ? 'rgba(239, 68, 68, 0.2)' : 'var(--card-inner-bg)',
              color: approvalFilter === 'disqualified' ? '#f87171' : 'var(--text-secondary)',
              border: approvalFilter === 'disqualified' ? '1px solid #ef4444' : '1px solid var(--glass-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Ban size={14} color="#f87171" /> Disqualified / Rejected ({countDisqualified})
          </button>
        </div>

        {/* View Mode Toggle: Kanban vs Grid */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-inner-bg)', padding: '4px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: viewMode === 'kanban' ? 'var(--accent-gradient)' : 'transparent',
              color: viewMode === 'kanban' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            📋 5-Stage Kanban
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: viewMode === 'grid' ? 'var(--accent-gradient)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            ⊞ Cards Grid
          </button>
        </div>
      </div>

      {/* COMPACT BUYER STREAM OR KANBAN BOARD */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto', width: '36px', height: '36px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Loading prospective buyer stream...
        </div>
      ) : displayLeads.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '50px 24px',
            borderRadius: '24px',
          }}
        >
          <Search size={40} color="var(--text-secondary)" style={{ opacity: 0.5, margin: '0 auto 16px auto' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>No Target Prospects Found for Selected Filter</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 20px auto' }}>
            {approvalFilter !== 'all' ? `No leads currently matching status "${approvalFilter}". Switch filters or sweep for new buyers!` : 'Use the Manual Keyword Search Console above to scan Reddit via Prowlo & Redditapis for high-intent buyers!'}
          </p>
          <button onClick={() => setApprovalFilter('all')} className="glass-button">
            Reset Filter & Show All Buyers
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(320px, 1fr))',
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '24px',
            alignItems: 'start',
            width: '100%',
            minWidth: 0,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {KANBAN_STAGES.map((col, colIdx) => {
            const colLeads = displayLeads.filter((l) => normalizeLeadStage(l) === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedId = e.dataTransfer.getData('text/plain');
                  if (droppedId) handleMoveStage(droppedId, col.id);
                }}
                className="glass-card"
                style={{
                  borderRadius: '20px',
                  padding: '16px',
                  minWidth: '320px',
                  minHeight: '620px',
                  background: col.bg,
                  border: `1px solid ${col.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: `2px solid ${col.color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{col.icon}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {col.title}
                    </span>
                  </div>
                  <span
                    style={{
                      background: col.color,
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      borderRadius: '10px',
                      padding: '2px 8px',
                    }}
                  >
                    {colLeads.length}
                  </span>
                </div>

                {/* Column Leads or Drop Placeholder */}
                {colLeads.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 12px',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      border: '1px dashed var(--glass-border)',
                      borderRadius: '14px',
                    }}
                  >
                    Drag leads here or advance from previous stage
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const leadId = lead._id || lead.id;
                    const isCommenter = lead.leadOrigin === 'thread_commenter';
                    const archetype = lead.psychologicalProfile?.archetype || 'Pragmatic Buyer';
                    const painPoint = lead.psychologicalProfile?.corePainPoint || lead.extractedPainPoint || 'Active solution request';

                    return (
                      <div
                        key={leadId}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', leadId)}
                        className="glass-card"
                        style={{
                          borderRadius: '16px',
                          padding: '14px',
                          border: '1px solid var(--glass-border)',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                          background: 'var(--card-inner-bg)',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          minWidth: 0,
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* Origin Pill & Intent Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: isCommenter ? 'rgba(168, 85, 247, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                              color: isCommenter ? '#c084fc' : '#818cf8',
                              border: isCommenter ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)',
                            }}
                          >
                            {isCommenter ? '💬 Commenter' : '📝 Post OP'}
                          </span>

                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            🔥 {lead.intentScore || 85}%
                          </span>
                        </div>

                        {/* Subreddit & Author */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '0.75rem', minWidth: 0 }}>
                          <span style={{ fontWeight: '700', color: 'var(--accent-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                            r/{lead.subreddit}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                            u/{lead.author}
                          </span>
                        </div>

                        {/* Post Title / Comment Quote */}
                        <p
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            margin: 0,
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {isCommenter && lead.commentQuote ? `"${lead.commentQuote}"` : lead.postTitle}
                        </p>

                        {/* Psychological Archetype & Pain Point */}
                        <div
                          style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '10px',
                            padding: '6px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            minWidth: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#fbbf24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            🧠 {archetype}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {painPoint}
                          </div>
                        </div>

                        {/* Stage Movement Controls & Agent Actions (Clean 2-Tier Layout) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                          {/* Tier 1: Stage Shift & Inspect */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                            <button
                              type="button"
                              disabled={colIdx === 0}
                              onClick={() => handleMoveStage(leadId, KANBAN_STAGES[colIdx - 1].id)}
                              style={{
                                width: '32px',
                                height: '30px',
                                background: 'var(--card-inner-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: colIdx === 0 ? 'not-allowed' : 'pointer',
                                color: colIdx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                opacity: colIdx === 0 ? 0.35 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                              title="Move to previous stage"
                            >
                              ←
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedLeadForModal(lead)}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                height: '30px',
                                background: 'var(--card-inner-bg)',
                                border: '1px solid var(--accent-primary)',
                                borderRadius: '8px',
                                padding: '0 8px',
                                fontSize: '0.74rem',
                                fontWeight: '700',
                                color: 'var(--accent-primary)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Eye size={12} /> Inspect
                            </button>

                            <button
                              type="button"
                              disabled={colIdx === KANBAN_STAGES.length - 1}
                              onClick={() => handleMoveStage(leadId, KANBAN_STAGES[colIdx + 1].id)}
                              style={{
                                width: '32px',
                                height: '30px',
                                background: 'var(--card-inner-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: colIdx === KANBAN_STAGES.length - 1 ? 'not-allowed' : 'pointer',
                                color: colIdx === KANBAN_STAGES.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                                opacity: colIdx === KANBAN_STAGES.length - 1 ? 0.35 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                              title="Advance to next stage"
                            >
                              →
                            </button>
                          </div>

                          {/* Tier 2: Dedicated Outreach Agent Buttons */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedLeadForDmAgent(lead)}
                              style={{
                                height: '30px',
                                background: 'rgba(255, 69, 0, 0.12)',
                                border: '1px solid rgba(255, 69, 0, 0.35)',
                                borderRadius: '8px',
                                padding: '0 6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                color: '#ff6b35',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title="Open Intelligent DM Agent with human connection strategy"
                            >
                              <Mail size={12} color="#ff6b35" /> DM Agent
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedLeadForEmailAgent(lead)}
                              style={{
                                height: '30px',
                                background: 'rgba(59, 130, 246, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.35)',
                                borderRadius: '8px',
                                padding: '0 6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                color: '#60a5fa',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title="Open Intelligent Email Agent with Human-In-The-Loop approval"
                            >
                              <Mail size={12} color="#60a5fa" /> Email Agent
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '22px',
              marginBottom: '28px',
            }}
          >
            {paginatedLeads.map((lead) => {
              const leadId = lead._id || lead.id;
              const isCommenter = lead.leadOrigin === 'thread_commenter';
              const karma = lead.prospectSnapshot?.karma || 1240;
              const accountAge = lead.prospectSnapshot?.accountAgeDays || 365;
              const years = Math.floor(accountAge / 365);
              const months = Math.floor((accountAge % 365) / 30);
              const ageString = years > 0 ? `${years}y ${months}m` : `${months}m`;
              
              const status = lead.approvalStatus || 'draft';
              const isSent = status === 'sent';
              const isDisqualified = status === 'disqualified';

              return (
                <div
                  key={leadId}
                  className="glass-card animate-fade-in"
                  style={{
                    padding: '22px',
                    borderRadius: '20px',
                    border: isSent
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : isDisqualified
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : '1px solid var(--glass-border)',
                    background: isSent
                      ? 'rgba(16, 185, 129, 0.03)'
                      : isDisqualified
                      ? 'rgba(239, 68, 68, 0.03)'
                      : 'var(--glass-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Top Bar: Source Pill, Subreddit Tag, Intent Score & Status Badge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: isCommenter ? 'rgba(20, 184, 166, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: isCommenter ? '#14b8a6' : 'var(--accent-primary)',
                            border: isCommenter ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          {isCommenter ? '💬 Commenter' : '👤 Author'}
                        </span>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            background: 'var(--card-inner-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                          }}
                        >
                          {lead.subreddit || 'r/homesecurity'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            color: '#f59e0b',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '3px 9px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Flame size={12} /> {lead.intentScore || 85}/100
                        </span>

                        {isSent ? (
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '3px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                            ✓ Sent
                          </span>
                        ) : isDisqualified ? (
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '3px 8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            ✗ Rejected
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '3px 8px', borderRadius: '10px', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber-border)' }}>
                            ⏳ Draft
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Targetable Username */}
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '6px' }}>
                      u/{lead.author || 'reddit_user'}
                    </h4>

                    {/* Thread & Comment Authenticity Quote Box */}
                    {isCommenter ? (
                      <div style={{ background: 'var(--card-inner-bg)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginTop: '4px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#14b8a6', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                          <MessageSquare size={13} /> Commented in: "{lead.postTitle}"
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.45 }}>
                          "{lead.commentQuote || lead.postSnippet || lead.postTitle}"
                        </p>
                        {lead.permalink && (
                          <a
                            href={lead.permalink.startsWith('http') ? lead.permalink : `https://reddit.com${lead.permalink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', textDecoration: 'none', fontWeight: '700' }}
                          >
                            Verify Comment on Reddit <ArrowUpRight size={13} />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: 'var(--card-inner-bg)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginTop: '4px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                          <User size={13} /> Posted Discussion Title:
                        </div>
                        <p
                          style={{
                            fontSize: '0.84rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.45,
                            fontStyle: 'italic',
                          }}
                        >
                          "{lead.postTitle}"
                        </p>
                        {lead.permalink && (
                          <a
                            href={lead.permalink.startsWith('http') ? lead.permalink : `https://reddit.com${lead.permalink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', textDecoration: 'none', fontWeight: '700' }}
                          >
                            Verify Thread on Reddit <ArrowUpRight size={13} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Clean Trust & Telemetry Strip */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: 'var(--card-inner-bg)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ShieldCheck size={13} /> Verified Organic
                    </span>
                    <span style={{ color: 'var(--glass-border)' }}>•</span>
                    <span style={{ color: '#818cf8', fontWeight: '700' }}>{karma.toLocaleString()} Karma</span>
                    <span style={{ color: 'var(--glass-border)' }}>•</span>
                    <span>{ageString} old</span>
                  </div>

                  {/* Extracted Pain Point Snippet */}
                  {lead.extractedPainPoint && (
                    <div style={{ background: 'var(--card-inner-bg)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Detected Need:</strong> {lead.extractedPainPoint.substring(0, 95)}...
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                      onClick={() => setSelectedLeadForModal(lead)}
                      className="glass-button-secondary"
                      style={{ padding: '8px 10px', fontSize: '0.78rem', gap: '6px', fontWeight: '700', justifyContent: 'center' }}
                      title="View AI Telemetry, Marketing Intel & Copy DMs"
                    >
                      <Eye size={14} color="var(--accent-primary)" /> Details
                    </button>

                    <button
                      onClick={() => setSelectedLeadForDmAgent(lead)}
                      className="glass-button"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.78rem',
                        gap: '6px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, rgba(255, 69, 0, 0.25) 0%, rgba(255, 107, 53, 0.25) 100%)',
                        color: '#ff6b35',
                        border: '1px solid rgba(255, 69, 0, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Open Intelligent DM Agent Studio"
                    >
                      <Mail size={14} color="#ff6b35" /> DM Agent
                    </button>

                    <button
                      onClick={() => setSelectedLeadForEmailAgent(lead)}
                      className="glass-button"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.78rem',
                        gap: '6px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Open Intelligent Email Agent Studio (Strict HIL)"
                    >
                      <Mail size={14} color="#60a5fa" /> Email Agent
                    </button>

                    <button
                      onClick={() => handleApproveDM(leadId, lead.openerDraft?.content)}
                      disabled={isSent}
                      className={isSent ? 'glass-button-secondary' : 'glass-button'}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                        background: isSent ? 'rgba(16, 185, 129, 0.15)' : undefined,
                        color: isSent ? '#34d399' : undefined,
                        border: isSent ? '1px solid rgba(16, 185, 129, 0.3)' : undefined,
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={14} />
                      {isSent ? 'Sent' : 'Approve'}
                    </button>

                    {isDisqualified ? (
                      <button
                        onClick={() => handleHardDelete(leadId)}
                        className="glass-button-secondary"
                        style={{ padding: '8px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', justifyContent: 'center' }}
                        title="Delete Permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDisqualify(leadId)}
                        className="glass-button-secondary"
                        style={{ padding: '8px 10px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', justifyContent: 'center' }}
                        title="Disqualify Lead"
                      >
                        <Ban size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* EXECUTIVE PAGINATION BAR (Full-Width Flex Layout with Dynamic Cards Per Page Selector) */}
          <div
            className="glass-card"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 28px',
              borderRadius: '20px',
              marginTop: '24px',
              boxSizing: 'border-box',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Showing <strong style={{ color: 'var(--text-primary)' }}>{displayLeads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>–<strong style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * itemsPerPage, displayLeads.length)}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{displayLeads.length}</strong> Targetable Buyers
              </div>

              {/* DYNAMIC CARDS PER PAGE SELECTOR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Cards / Page:</span>
                <CustomSelect
                  options={[
                    { value: 6, label: '6 cards' },
                    { value: 12, label: '12 cards' },
                    { value: 24, label: '24 cards' },
                    { value: 48, label: '48 cards' },
                    { value: 1000, label: 'Show All' },
                  ]}
                  value={itemsPerPage}
                  onChange={(val) => {
                    setItemsPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="glass-button-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', padding: '0 4px' }}>
                Page {currentPage} of {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="glass-button-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* LEAD INTEL & WHY CHOSEN AUDIT MODAL RENDERED VIA REACT PORTAL */}
      {selectedLeadForModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(3, 7, 18, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedLeadForModal(null);
              }
            }}
          >
            <div
              className="glass-card animate-scale-up"
              style={{
                width: '100%',
                maxWidth: '720px',
                maxHeight: '88vh',
                overflowY: 'auto',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid var(--glass-border-hover)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
                position: 'relative',
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                    <Database size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Prowlo & OpenAI Lead Telemetry
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Why u/{selectedLeadForModal.author} was selected as a targetable buyer
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLeadForModal(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Live Provider Data Banner */}
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} color="#818cf8" />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Prowlo Live Intelligence Feed
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Source: Reddit Live API via Prowlo Engine • Mode: Semantic Intent
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                    0.0% Spam Risk
                  </span>
                </div>

                {/* Target Prospect Info */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    PROSPECT IDENTITY & TRUST TELEMETRY
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                          u/{selectedLeadForModal.author}
                        </h4>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '8px', background: selectedLeadForModal.leadOrigin === 'thread_commenter' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(99, 102, 241, 0.15)', color: selectedLeadForModal.leadOrigin === 'thread_commenter' ? '#14b8a6' : '#818cf8', border: selectedLeadForModal.leadOrigin === 'thread_commenter' ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)' }}>
                          {selectedLeadForModal.leadOrigin === 'thread_commenter' ? '💬 Thread Commenter' : '👤 Post Author (OP)'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Subreddit: <strong>{selectedLeadForModal.subreddit}</strong> {selectedLeadForModal.leadOrigin === 'thread_commenter' && selectedLeadForModal.opAuthor && <> • Commented on thread by <strong>u/{selectedLeadForModal.opAuthor}</strong></>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        <ShieldCheck size={12} /> Verified Organic
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '10px', background: 'var(--glass-bg)', color: '#818cf8' }}>
                        {selectedLeadForModal.prospectSnapshot?.karma || 1240} Karma
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thread Context & Verbatim Quote */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    EXTRACTED THREAD TITLE & VERBATIM QUOTE
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    "{selectedLeadForModal.postTitle}"
                  </p>

                  {selectedLeadForModal.opAuthor && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Thread posted by <strong>u/{selectedLeadForModal.opAuthor}</strong> in {selectedLeadForModal.subreddit}
                    </div>
                  )}

                  {selectedLeadForModal.leadOrigin === 'thread_commenter' && selectedLeadForModal.commentQuote ? (
                    <div style={{ background: 'rgba(20, 184, 166, 0.08)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(20, 184, 166, 0.25)', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#14b8a6', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={13} /> EXACT COMMENT BY PROSPECT u/{selectedLeadForModal.author}:
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.45 }}>
                        "{selectedLeadForModal.commentQuote}"
                      </p>
                    </div>
                  ) : selectedLeadForModal.postSnippet && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.25)', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#818cf8', marginBottom: '4px' }}>
                        POST TEXT BY OP u/{selectedLeadForModal.author}:
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.45 }}>
                        "{selectedLeadForModal.postSnippet}"
                      </p>
                    </div>
                  )}

                  {selectedLeadForModal.permalink && (
                    <a
                      href={selectedLeadForModal.permalink.startsWith('http') ? selectedLeadForModal.permalink : `https://reddit.com${selectedLeadForModal.permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.82rem',
                        padding: '9px 18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '10px',
                        textDecoration: 'none',
                        fontWeight: '800',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 16px rgba(79, 70, 229, 0.45)',
                      }}
                    >
                      Verify u/{selectedLeadForModal.author} on Reddit Live <ArrowUpRight size={15} color="#ffffff" />
                    </a>
                  )}
                </div>

                {/* 3D Intent Breakdown */}
                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Flame size={16} /> OpenAI 3D Intent Score: {selectedLeadForModal.intentScore || 85}/100
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      {selectedLeadForModal.intentBadge || 'High Intent'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                    <div style={{ background: 'var(--card-bg)', padding: '8px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Problem Fit</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {selectedLeadForModal.scoreBreakdown?.problemFit || 40}%
                      </div>
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '8px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Audience Fit</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {selectedLeadForModal.scoreBreakdown?.audienceFit || 35}%
                      </div>
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '8px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Urgency</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {selectedLeadForModal.scoreBreakdown?.urgency || 10}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rationale & Pain Point */}
                {selectedLeadForModal.extractedPainPoint && (
                  <div style={{ background: 'var(--card-inner-bg)', padding: '14px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      EXTRACTED PAIN POINT & RATIONALE
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {selectedLeadForModal.extractedPainPoint}
                    </p>
                  </div>
                )}

                {/* DUAL-MODE TAILORED DM DRAFT PREVIEW INSIDE MODAL WITH 1-CLICK COPY BUTTONS */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageSquare size={14} color="var(--accent-primary)" /> SELECT OUTREACH DM TYPE:
                    </div>

                    <div style={{ display: 'flex', gap: '6px', background: 'var(--glass-bg)', padding: '3px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                      <button
                        type="button"
                        onClick={() => setModalDmMode('opener')}
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          background: modalDmMode === 'opener' ? 'var(--accent-primary)' : 'transparent',
                          color: modalDmMode === 'opener' ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        ⚡ Conversational Opener
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalDmMode('brandEmail')}
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          background: modalDmMode === 'brandEmail' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                          color: modalDmMode === 'brandEmail' ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        📧 Brand Email Assistance DM
                      </button>
                    </div>
                  </div>

                  {modalDmMode === 'brandEmail' ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} /> Tailored to invite prospect to email <strong>support@{selectedLeadForModal.targetDomain || 'AlertCareLine.com'}</strong> or drop their email:
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const textToCopy = selectedLeadForModal.brandEmailDmDraft?.content || `Hey u/${selectedLeadForModal.author}, saw your r/${selectedLeadForModal.subreddit} post regarding ${selectedLeadForModal.postTitle.substring(0, 40).toLowerCase()}... At ${selectedLeadForModal.targetDomain || 'AlertCareLine.com'}, we built a dedicated solution to solve this exact issue. If you'd like tailored assistance or demo info sent directly to your inbox, drop your preferred email ID here or feel free to email our team at support@${selectedLeadForModal.targetDomain || 'AlertCareLine.com'}!`;
                            navigator.clipboard.writeText(textToCopy);
                            showToast('📋 Brand Email DM copied to clipboard!');
                          }}
                          style={{ fontSize: '0.72rem', fontWeight: '800', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          📋 Copy Brand Email DM
                        </button>
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45, fontStyle: 'italic', background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        "{selectedLeadForModal.brandEmailDmDraft?.content || `Hey u/${selectedLeadForModal.author}, saw your r/${selectedLeadForModal.subreddit} post regarding ${selectedLeadForModal.postTitle.substring(0, 40).toLowerCase()}... At ${selectedLeadForModal.targetDomain || 'AlertCareLine.com'}, we built a dedicated solution to solve this exact issue. If you'd like tailored assistance or demo info sent directly to your inbox, drop your preferred email ID here or feel free to email our team at support@${selectedLeadForModal.targetDomain || 'AlertCareLine.com'}!`}"
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#818cf8' }}>
                          Low-friction 20-40 word conversational question:
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const textToCopy = selectedLeadForModal.openerDraft?.content || `Hey u/${selectedLeadForModal.author}, saw your post in ${selectedLeadForModal.subreddit}. Curious how you're handling this currently?`;
                            navigator.clipboard.writeText(textToCopy);
                            showToast('📋 Conversational Opener copied to clipboard!');
                          }}
                          style={{ fontSize: '0.72rem', fontWeight: '800', background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          📋 Copy Conversational Opener
                        </button>
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45, fontStyle: 'italic', background: 'rgba(99, 102, 241, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        "{selectedLeadForModal.openerDraft?.content || `Hey u/${selectedLeadForModal.author}, saw your post in ${selectedLeadForModal.subreddit}. Curious how you're handling this currently?`}"
                      </p>
                    </div>
                  )}
                </div>

                {/* INTENSE MARKETING & CAMPAIGN INTELLIGENCE SUITE */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '18px', borderRadius: '18px', border: '1px solid rgba(99, 102, 241, 0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}>
                      <Sparkles size={16} color="var(--accent-primary)" /> MARKETING & CAMPAIGN INTELLIGENCE
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                      AI Growth Playbook
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    {/* Buyer Journey Stage */}
                    <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '4px' }}>BUYER JOURNEY STAGE</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={14} color="#34d399" />
                        {selectedLeadForModal.marketingIntel?.buyerStage || 'Consideration'}
                      </div>
                    </div>

                    {/* Competitor Weaknesses & Vulnerabilities */}
                    <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '4px' }}>COMPETITOR VULNERABILITIES</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {((selectedLeadForModal.marketingIntel?.competitorVulnerabilities) || ['Contract lock-in', 'False alerts']).map((vuln, vIdx) => (
                          <span key={vIdx} style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                            ⚡ {vuln}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strategic Positioning Pitch */}
                  <div style={{ background: 'var(--glass-bg)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '4px' }}>RECOMMENDED POSITIONING ANGLE</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {selectedLeadForModal.marketingIntel?.positioningPitch || `Position ${selectedLeadForModal.targetDomain || 'AlertCareLine.com'} as a zero-contract, instant-setup alternative addressing exact user friction.`}
                    </p>
                  </div>

                  {/* Copywriter Ad & Social Hook */}
                  <div style={{ background: 'rgba(99, 102, 241, 0.06)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#818cf8' }}>GROWTH COPYWRITER AD HOOK</div>
                      <button
                        type="button"
                        onClick={() => {
                          const textToCopy = selectedLeadForModal.marketingIntel?.adContentHook || `Tired of contract lock-in? Discover how ${selectedLeadForModal.targetDomain || 'AlertCareLine.com'} gives 24/7 peace of mind!`;
                          navigator.clipboard.writeText(textToCopy);
                          showToast('📋 Ad Hook copied to clipboard!');
                        }}
                        style={{ fontSize: '0.68rem', fontWeight: '800', background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}
                      >
                        Copy Hook
                      </button>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.45 }}>
                      "{selectedLeadForModal.marketingIntel?.adContentHook || `Tired of false alerts and contract lock-in? Discover how ${selectedLeadForModal.targetDomain || 'AlertCareLine.com'} gives 24/7 peace of mind without hidden fees.`}"
                    </p>
                  </div>
                </div>

                {/* 360° MARKETER PROSPECT BEHAVIORAL AUDIT (DO'S & DON'TS) */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
                    padding: '20px',
                    borderRadius: '20px',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                      <ShieldCheck size={18} color="#34d399" /> 360° PROSPECT BEHAVIORAL AUDIT (MARKETER GUIDANCE)
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '3px 10px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.18)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.35)' }}>
                        Tone: {selectedLeadForModal.prospectBehavioralAudit?.prospectTone || 'Direct & Solution-Seeking'}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '3px 10px', borderRadius: '10px', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber-border)' }}>
                        {selectedLeadForModal.prospectBehavioralAudit?.riskLevel || 'Low Risk'}
                      </span>
                    </div>
                  </div>

                  {/* Buyer Expectation Bar */}
                  <div style={{ background: 'var(--card-inner-bg)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      BUYER EXPECTATION & MINDSET
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      💡 {selectedLeadForModal.prospectBehavioralAudit?.buyerExpectation || 'Expects clear product transparency, direct answers, and zero pushy sales talk.'}
                    </p>
                  </div>

                  {/* Side-by-Side DO'S & DON'TS Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    {/* Marketer DO's */}
                    <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#4ade80', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={16} /> MARKETER DO'S (BEST ENGAGEMENT)
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                        {(selectedLeadForModal.prospectBehavioralAudit?.doList || [
                          `Reference their exact r/${selectedLeadForModal.subreddit} context`,
                          `Highlight zero-contract flexibility of ${selectedLeadForModal.targetDomain || 'AlertCareLine.com'}`,
                          `Ask a low-friction question about their current setup`
                        ]).map((doItem, dIdx) => (
                          <li key={dIdx} style={{ marginBottom: '4px' }}>{doItem}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Marketer DON'TS */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Ban size={16} /> MARKETER DON'TS (STRICT AVOIDANCE)
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                        {(selectedLeadForModal.prospectBehavioralAudit?.dontList || [
                          `Do NOT send long generic sales brochures or templates`,
                          `Do NOT push for immediate phone calls before providing info`,
                          `Do NOT ignore their budget or hardware concerns`
                        ]).map((dontItem, dtIdx) => (
                          <li key={dtIdx} style={{ marginBottom: '4px' }}>{dontItem}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Golden Approach Pitch */}
                  <div style={{ background: 'var(--accent-amber-bg)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--accent-amber-border)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-amber)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} color="var(--accent-amber)" /> GOLDEN MEETING & OUTREACH STRATEGY
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.45, fontWeight: '600' }}>
                      {selectedLeadForModal.prospectBehavioralAudit?.bestApproachPitch || `Validate their r/${selectedLeadForModal.subreddit} scenario with genuine empathy, then present ${selectedLeadForModal.targetDomain || 'AlertCareLine.com'} as a low-friction option.`}
                    </p>
                  </div>
                </div>

                {/* Brand Domain CustomSelect Dropdown inside Modal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Tag size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    Assigned Brand:
                  </span>
                  <div style={{ flex: 1 }}>
                    <CustomSelect
                      options={brandSelectOptions}
                      value={selectedLeadForModal.targetDomain || 'AlertCareLine.com'}
                      onChange={(newDomain) => handleBrandDomainChange(selectedLeadForModal._id || selectedLeadForModal.id, newDomain)}
                    />
                  </div>
                </div>

                {/* DEEP PSYCHOLOGICAL PROFILE & VALUE DRIVERS CARD */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(168, 85, 247, 0.09) 100%)',
                    padding: '18px',
                    borderRadius: '18px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🧠 PSYCHOLOGICAL PROFILING & CORE VALUE DRIVERS
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '3px 10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                      Archetype: {selectedLeadForModal.psychologicalProfile?.archetype || 'Pragmatic Buyer'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: 'var(--card-inner-bg)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        EMOTIONAL MINDSET
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                        {selectedLeadForModal.psychologicalProfile?.emotionalMindset || 'Evaluating solutions with care and seeking transparent terms.'}
                      </p>
                    </div>

                    <div style={{ background: 'var(--card-inner-bg)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        CORE PAIN POINT
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#f87171', margin: 0, lineHeight: 1.4, fontWeight: '600' }}>
                        {selectedLeadForModal.psychologicalProfile?.corePainPoint || selectedLeadForModal.extractedPainPoint || 'Friction identified in Reddit discussion.'}
                      </p>
                    </div>
                  </div>

                  {/* What is Important To Them */}
                  <div style={{ background: 'var(--card-inner-bg)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      WHAT IS IMPORTANT TO THIS PROSPECT (DECISION CRITERIA)
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(selectedLeadForModal.psychologicalProfile?.whatIsImportant || [
                        'Upfront transparent pricing',
                        'Zero vendor lock-in',
                        'Direct responsive support'
                      ]).map((item, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '8px',
                            padding: '3px 10px',
                          }}
                        >
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pipeline Stage Transition Control */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '14px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    MOVE TO KANBAN STAGE:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {KANBAN_STAGES.map((stg) => {
                      const isActive = normalizeLeadStage(selectedLeadForModal) === stg.id;
                      return (
                        <button
                          key={stg.id}
                          type="button"
                          onClick={() => handleMoveStage(selectedLeadForModal._id || selectedLeadForModal.id, stg.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: isActive ? stg.color : 'transparent',
                            color: isActive ? '#ffffff' : 'var(--text-secondary)',
                            border: `1px solid ${isActive ? stg.color : 'var(--glass-border)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {stg.icon} {stg.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Reddit Session Direct Actions Banner */}
                <div
                  style={{
                    background: 'rgba(255, 69, 0, 0.08)',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 69, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Radio size={16} color="#ff4500" />
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ff6b35' }}>
                        Direct Reddit Session Delivery
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Uses authenticated cookies via api.redditapis.com
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={sendingViaRedditSession}
                      onClick={() => handleSendDirectRedditDm(selectedLeadForModal)}
                      className="glass-button"
                      style={{
                        background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                        color: '#ffffff',
                        border: 'none',
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      {sendingViaRedditSession ? <RefreshCw size={14} className="spin" /> : <Radio size={15} />}
                      {sendingViaRedditSession ? 'Sending Live DM...' : `Dispatch Direct Message to u/${selectedLeadForModal.author}`}
                    </button>

                    <button
                      type="button"
                      disabled={sendingViaRedditSession}
                      onClick={() => handlePostRedditThreadComment(selectedLeadForModal)}
                      className="glass-button-secondary"
                      style={{
                        borderColor: 'rgba(255, 69, 0, 0.4)',
                        color: '#ff6b35',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <MessageSquare size={15} />
                      Post as Thread Reply
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetLead = selectedLeadForModal;
                        setSelectedLeadForModal(null);
                        setSelectedLeadForDmAgent(targetLead);
                      }}
                      className="glass-button"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                      }}
                    >
                      <Sparkles size={15} /> Open Intelligent DM Agent & Connection Strategy Studio
                    </button>

                    <button
                      onClick={() => setSelectedLeadForEmailAgent(selectedLeadForModal)}
                      className="glass-button"
                      style={{
                        marginTop: '8px',
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(99, 102, 241, 0.35) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
                      }}
                    >
                      <Mail size={15} color="#93c5fd" /> Open Intelligent Email Agent Studio (Strict HIL)
                    </button>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    onClick={() => {
                      const leadId = selectedLeadForModal._id || selectedLeadForModal.id;
                      const msg = modalDmMode === 'brandEmail'
                        ? (selectedLeadForModal.brandEmailDmDraft?.content || `Hey u/${selectedLeadForModal.author}, saw your r/${selectedLeadForModal.subreddit} post regarding ${selectedLeadForModal.postTitle.substring(0, 40).toLowerCase()}... At ${selectedLeadForModal.targetDomain || 'AlertCareLine.com'}, we built a dedicated solution to solve this exact issue. If you'd like tailored assistance or demo info sent directly to your inbox, drop your preferred email ID here or feel free to email our team at support@${selectedLeadForModal.targetDomain || 'AlertCareLine.com'}!`)
                        : (selectedLeadForModal.openerDraft?.content || `Hey u/${selectedLeadForModal.author}, saw your post in ${selectedLeadForModal.subreddit}. Curious how you're handling this currently?`);
                      handleApproveDM(leadId, msg);
                    }}
                    disabled={selectedLeadForModal.approvalStatus === 'sent'}
                    className="glass-button"
                    style={{ flex: 1 }}
                  >
                    <Check size={16} />
                    {selectedLeadForModal.approvalStatus === 'sent' ? 'DM Approved & Sent' : 'Approve Draft (Internal)'}
                  </button>

                  <button
                    onClick={() => handleDisqualify(selectedLeadForModal._id || selectedLeadForModal.id)}
                    className="glass-button-secondary"
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    <Ban size={16} /> Disqualify
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* LIVE EXTRACTION PIPELINE FLOWCHART & STATUS MODAL */}
      {sweepModalState.isOpen &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(3, 7, 18, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="glass-card animate-scale-up"
              style={{
                width: '100%',
                maxWidth: '840px',
                maxHeight: '92vh',
                overflowY: 'auto',
                borderRadius: '24px',
                padding: '30px',
                border: '1px solid var(--glass-border-hover)',
                boxShadow: '0 28px 70px rgba(0,0,0,0.85)',
                position: 'relative',
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', borderRadius: '14px', background: 'var(--accent-gradient)', color: '#ffffff', boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)' }}>
                    <Activity size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Live Lead Agent Extraction Pipeline
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Prowlo & OpenAI Pipeline Status • Target: <strong>{sweepModalState.subName}</strong> ({sweepModalState.domainName})
                    </p>
                  </div>
                </div>

                {sweepModalState.isComplete && (
                  <button
                    onClick={() => setSweepModalState(prev => ({ ...prev, isOpen: false }))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <X size={22} />
                  </button>
                )}
              </div>

              {/* Modal View Tab Switcher */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSweepModalState(prev => ({ ...prev, activeTab: 'flowchart' }))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: sweepModalState.activeTab === 'flowchart' ? 'var(--accent-gradient)' : 'var(--card-inner-bg)',
                    color: sweepModalState.activeTab === 'flowchart' ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Activity size={15} /> ⚡ Live Flowchart & Terminal
                </button>

                <button
                  type="button"
                  onClick={() => setSweepModalState(prev => ({ ...prev, activeTab: 'audit' }))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: sweepModalState.activeTab === 'audit' ? 'var(--accent-gradient)' : 'var(--card-inner-bg)',
                    color: sweepModalState.activeTab === 'audit' ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Database size={15} /> 📋 Evaluated Items Feed ({sweepModalState.auditItems.length})
                </button>
              </div>

              {/* TAB 1: FLOWCHART & TERMINAL */}
              {sweepModalState.activeTab === 'flowchart' ? (
                <>
                  {/* FLOWCHART PIPELINE STEPPER (4 STEPS VISUAL DIAGRAM) */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                      LIVE EXECUTION FLOWCHART
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', position: 'relative' }}>
                      {/* Step 1: Prowlo Engine */}
                      <div
                        style={{
                          background: sweepModalState.currentStep === 1 ? 'rgba(99, 102, 241, 0.15)' : sweepModalState.currentStep > 1 ? 'rgba(16, 185, 129, 0.1)' : 'var(--card-inner-bg)',
                          border: sweepModalState.currentStep === 1 ? '1px solid var(--accent-primary)' : sweepModalState.currentStep > 1 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--glass-border)',
                          padding: '14px',
                          borderRadius: '16px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '12px', background: sweepModalState.currentStep >= 1 ? 'rgba(99, 102, 241, 0.2)' : 'var(--glass-bg)', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                          <Globe size={18} />
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>1. Prowlo API</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Live Discussions</div>
                        <div style={{ marginTop: '8px' }}>
                          {sweepModalState.currentStep === 1 ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <RefreshCw size={10} className="spin-animation" /> Fetching
                            </span>
                          ) : sweepModalState.currentStep > 1 ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                              ✓ Complete
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)' }}>Waiting</span>
                          )}
                        </div>
                      </div>

                      {/* Step 2: OpenAI */}
                      <div
                        style={{
                          background: sweepModalState.currentStep === 2 ? 'rgba(139, 92, 246, 0.15)' : sweepModalState.currentStep > 2 ? 'rgba(16, 185, 129, 0.1)' : 'var(--card-inner-bg)',
                          border: sweepModalState.currentStep === 2 ? '1px solid #8b5cf6' : sweepModalState.currentStep > 2 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--glass-border)',
                          padding: '14px',
                          borderRadius: '16px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '12px', background: sweepModalState.currentStep >= 2 ? 'rgba(139, 92, 246, 0.2)' : 'var(--glass-bg)', color: '#a78bfa', marginBottom: '8px' }}>
                          <Cpu size={18} />
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>2. OpenAI (GPT-4o)</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>3D Intent Scoring</div>
                        <div style={{ marginTop: '8px' }}>
                          {sweepModalState.currentStep === 2 ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkles size={10} className="spin-animation" /> Scoring
                            </span>
                          ) : sweepModalState.currentStep > 2 ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                              ✓ Complete
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)' }}>Waiting</span>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Telemetry Audit */}
                      <div
                        style={{
                          background: sweepModalState.currentStep === 3 ? 'rgba(245, 158, 11, 0.15)' : sweepModalState.currentStep > 3 ? 'rgba(16, 185, 129, 0.1)' : 'var(--card-inner-bg)',
                          border: sweepModalState.currentStep === 3 ? '1px solid #f59e0b' : sweepModalState.currentStep > 3 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--glass-border)',
                          padding: '14px',
                          borderRadius: '16px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '12px', background: sweepModalState.currentStep >= 3 ? 'var(--accent-amber-bg)' : 'var(--glass-bg)', color: 'var(--accent-amber)', marginBottom: '8px' }}>
                          <ShieldCheck size={18} />
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>3. Trust Audit</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Karma & Spam Risk</div>
                        <div style={{ marginTop: '8px' }}>
                          {sweepModalState.currentStep === 3 ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={10} /> Auditing
                            </span>
                          ) : sweepModalState.currentStep > 3 ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                              ✓ Complete
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)' }}>Waiting</span>
                          )}
                        </div>
                      </div>

                      {/* Step 4: Brand Insertion */}
                      <div
                        style={{
                          background: sweepModalState.currentStep === 4 ? 'rgba(16, 185, 129, 0.15)' : 'var(--card-inner-bg)',
                          border: sweepModalState.currentStep === 4 ? '1px solid #10b981' : '1px solid var(--glass-border)',
                          padding: '14px',
                          borderRadius: '16px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '12px', background: sweepModalState.currentStep === 4 ? 'rgba(16, 185, 129, 0.2)' : 'var(--glass-bg)', color: '#34d399', marginBottom: '8px' }}>
                          <CheckCircle2 size={18} />
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>4. Lead Insertion</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Card Board Ready</div>
                        <div style={{ marginTop: '8px' }}>
                          {sweepModalState.currentStep === 4 ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                              ✓ Extracted ({sweepModalState.addedCount})
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)' }}>Waiting</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LIVE PROGRESS STATUS BAR */}
                  <div style={{ marginBottom: '20px', background: 'var(--card-inner-bg)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={14} className={!sweepModalState.isComplete ? 'spin-animation' : ''} color="var(--accent-primary)" />
                        {sweepModalState.statusText}
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                        {sweepModalState.progressPct !== undefined ? sweepModalState.progressPct : sweepModalState.currentStep * 25}%
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${sweepModalState.progressPct !== undefined ? sweepModalState.progressPct : sweepModalState.currentStep * 25}%`,
                          background: 'var(--accent-gradient)',
                          borderRadius: '10px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* LIVE TERMINAL LOG FEED */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <Terminal size={14} /> LIVE AGENT LOG TERMINAL
                    </div>

                    <div
                      style={{
                        background: 'var(--card-inner-bg-solid, #0f172a)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                        fontSize: '0.78rem',
                        color: '#e2e8f0',
                        maxHeight: '160px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {sweepModalState.logs.map((log, idx) => (
                        <div key={idx} style={{ lineHeight: 1.45 }}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* TAB 2: EVALUATED POSTS & COMMENTS AUDIT FEED (SELECTED VS REJECTED) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {/* Audit Filter Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-secondary)' }}>Filter Audit Feed:</span>
                    {['all', 'selected', 'rejected'].map(filterKey => {
                      const label = filterKey === 'all'
                        ? `All (${sweepModalState.auditItems.length})`
                        : filterKey === 'selected'
                        ? `✓ Selected (${sweepModalState.auditItems.filter(i => i.status === 'SELECTED').length})`
                        : `✗ Rejected (${sweepModalState.auditItems.filter(i => i.status === 'REJECTED').length})`;
                      const isAct = sweepModalState.auditFilter === filterKey;
                      return (
                        <button
                          key={filterKey}
                          type="button"
                          onClick={() => setSweepModalState(prev => ({ ...prev, auditFilter: filterKey }))}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '10px',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: isAct ? (filterKey === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)') : 'var(--card-inner-bg)',
                            color: isAct ? (filterKey === 'rejected' ? '#f87171' : 'var(--accent-primary)') : 'var(--text-secondary)',
                            border: isAct ? `1px solid ${filterKey === 'rejected' ? '#ef4444' : 'var(--accent-primary)'}` : '1px solid var(--glass-border)',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Audit List Stream */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                    {sweepModalState.auditItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 10px auto' }} />
                        <div>Evaluated posts audit stream loading...</div>
                      </div>
                    ) : (
                      sweepModalState.auditItems
                        .filter(item => {
                          if (sweepModalState.auditFilter === 'selected') return item.status === 'SELECTED';
                          if (sweepModalState.auditFilter === 'rejected') return item.status === 'REJECTED';
                          return true;
                        })
                        .map((item, idx) => {
                          const isSel = item.status === 'SELECTED';
                          const isComment = item.type === 'thread_commenter';
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: isSel ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                                border: isSel ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                              }}
                            >
                              {/* Top Bar: Status Badge, Username, Subreddit */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: '800',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      background: isSel ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                                      color: isSel ? '#4ade80' : '#f87171',
                                      border: isSel ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                    }}
                                  >
                                    {isSel ? `✓ SELECTED (${item.intentScore}/100)` : `✗ REJECTED (${item.intentScore}/100)`}
                                  </span>

                                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    u/{item.author}
                                  </span>

                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                    {item.subreddit}
                                  </span>

                                  <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', background: 'var(--card-inner-bg)', color: 'var(--text-secondary)' }}>
                                    {isComment ? '💬 Commenter' : '👤 Author'}
                                  </span>
                                </div>

                                {item.permalink && (
                                  <a
                                    href={item.permalink.startsWith('http') ? item.permalink : `https://reddit.com${item.permalink}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    Verify on Reddit <ArrowUpRight size={13} />
                                  </a>
                                )}
                              </div>

                              {/* Authenticity Box: Thread Title & Comment Quote */}
                              <div style={{ background: 'var(--card-inner-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                  {isComment ? 'PARENT DISCUSSION THREAD:' : 'DISCUSSION TITLE:'}
                                </div>
                                <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                  "{item.postTitle}"
                                </div>

                                {isComment && item.commentQuote && (
                                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#14b8a6', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <MessageSquare size={12} /> EXACT COMMENT WRITTEN BY u/{item.author}:
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                                      "{item.commentQuote}"
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Decision Rationale Box */}
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: '600',
                                  color: isSel ? '#34d399' : '#f87171',
                                  background: isSel ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  borderLeft: `4px solid ${isSel ? '#10b981' : '#ef4444'}`,
                                }}
                              >
                                <strong>Decision Rationale:</strong> {item.decisionRationale}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* MODAL FOOTER BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                {sweepModalState.isComplete ? (
                  <button
                    onClick={() => setSweepModalState(prev => ({ ...prev, isOpen: false }))}
                    className="glass-button"
                    style={{ padding: '10px 24px', fontSize: '0.88rem' }}
                  >
                    <CheckCircle2 size={16} /> View Extracted Prospects ({sweepModalState.addedCount})
                  </button>
                ) : (
                  <button
                    disabled
                    className="glass-button-secondary"
                    style={{ padding: '10px 24px', opacity: 0.7, cursor: 'not-allowed' }}
                  >
                    <RefreshCw size={16} className="spin-animation" /> Processing Live Streams...
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Confirm Clear Pipeline Board Custom Modal */}
      <ConfirmDeleteModal
        isOpen={showClearConfirmModal}
        title="Clear Lead Pipeline Board"
        itemName="All Pipeline Cards"
        message="Are you sure you want to clear all lead cards from the pipeline board? This will remove current search results from view."
        confirmText="Clear Board"
        cancelText="Cancel"
        isDeleting={isClearingBoard}
        onConfirm={handleConfirmClearBoard}
        onCancel={() => setShowClearConfirmModal(false)}
      />

      {/* Intelligent DM Outreach Agent Modal */}
      <DmOutreachAgentModal
        isOpen={Boolean(selectedLeadForDmAgent)}
        onClose={() => setSelectedLeadForDmAgent(null)}
        initialLead={selectedLeadForDmAgent}
        onDmSent={(leadId, sentText) => {
          setLeads((prev) =>
            prev.map((l) =>
              (l._id || l.id) === leadId
                ? { ...l, approvalStatus: 'sent', stage: 'Engaged / Replied', sentMessage: sentText }
                : l
            )
          );
          showToast(`🚀 DM dispatched via RedditAPIs! Lead advanced to "Engaged / Replied".`);
        }}
      />

      {/* Intelligent Email Outreach Agent Modal */}
      <EmailOutreachAgentModal
        isOpen={Boolean(selectedLeadForEmailAgent)}
        onClose={() => setSelectedLeadForEmailAgent(null)}
        initialLead={selectedLeadForEmailAgent}
        onEmailSent={(leadId, sentText) => {
          setLeads((prev) =>
            prev.map((l) =>
              (l._id || l.id) === leadId
                ? { ...l, approvalStatus: 'sent', stage: 'Engaged / Replied', emailSent: true, sentMessage: sentText }
                : l
            )
          );
          showToast(`📧 Email dispatched! Lead advanced to "Engaged / Replied".`);
        }}
      />
    </div>
  );
};
