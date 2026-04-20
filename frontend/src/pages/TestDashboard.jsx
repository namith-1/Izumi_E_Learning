import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, List, Terminal, FileText, CheckCircle2, XCircle, Loader2, BarChart3, ChevronRight } from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';
import './css/AdminDashboard.css';

const TestDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [runningTest, setRunningTest] = useState(null);
    const [logs, setLogs] = useState('');
    const [testResults, setTestResults] = useState({});
    const logEndRef = useRef(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login', { replace: true });
            return;
        }
        fetchTests();
    }, [user, navigate]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const fetchTests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/tests', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTests(data);
            }
        } catch (err) {
            console.error("Failed to fetch tests", err);
        } finally {
            setLoading(false);
        }
    };

    const runTest = async (testPath) => {
        setRunningTest(testPath);
        setLogs(prev => prev + `\n> Running: ${testPath}...\n`);
        
        try {
            const res = await fetch('http://localhost:5000/api/tests/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ testPath })
            });
            const data = await res.json();
            
            const newLogs = data.stdout + (data.stderr || '');
            setLogs(prev => prev + newLogs + "\n-----------------------------------\n");
            
            setTestResults(prev => ({
                ...prev,
                [testPath]: data.success ? 'pass' : 'fail'
            }));
        } catch (err) {
            setLogs(prev => prev + `\n[ERROR]: ${err.message}\n`);
            setTestResults(prev => ({ ...prev, [testPath]: 'fail' }));
        } finally {
            setRunningTest(null);
        }
    };

    const runAllTests = async () => {
        setLogs('> Starting Global Test Suite...\n');
        for (const test of tests) {
            await runTest(test.path);
        }
        setLogs(prev => prev + '\n> Global execution finished.');
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
    );

    return (
        <div className="admin-dash-layout student-dash-layout">
            <header className="student-navbar">
                <div className="nav-brand text-blue-600">
                    <Terminal size={24} /> <span>Test Infrastructure</span>
                </div>
                <nav className="nav-links">
                    <button onClick={() => navigate('/admin')} className="nav-link-item">
                        <BarChart3 size={18} /> Back to Dashboard
                    </button>
                    <button onClick={runAllTests} disabled={!!runningTest} className="nav-link-item text-green-600 font-bold">
                        <Play size={18} /> Run All Features
                    </button>
                </nav>
                <div className="nav-user-info"><ProfileDropdown user={user} currentPath="/admin/tests" /></div>
            </header>

            <main className="student-main-content grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                {/* Test List */}
                <div className="lg:col-span-12 xl:col-span-5">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <List size={18} /> Feature Test Suites
                            </h3>
                            <button 
                                onClick={() => { setLogs(''); setTestResults({}); }} 
                                className="text-xs text-gray-500 hover:text-blue-500 flex items-center gap-1"
                            >
                                <RotateCcw size={12} /> Clear Results
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {tests.map(test => (
                                <div key={test.path} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${testResults[test.path] === 'pass' ? 'bg-green-100 text-green-600' : testResults[test.path] === 'fail' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-500'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">{test.name.replace('.test.js', '')}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <span className="capitalize">{test.category}</span>
                                                <ChevronRight size={10} />
                                                <span>{test.path}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {testResults[test.path] === 'pass' && <CheckCircle2 className="text-green-500" size={20} />}
                                        {testResults[test.path] === 'fail' && <XCircle className="text-red-500" size={20} />}
                                        <button 
                                            onClick={() => runTest(test.path)}
                                            disabled={!!runningTest}
                                            className={`p-2 rounded-full transition-all ${runningTest === test.path ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                        >
                                            {runningTest === test.path ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Console / Output */}
                <div className="lg:col-span-12 xl:col-span-7">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl h-full flex flex-col min-h-[500px]">
                        <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-xs text-gray-400 ml-2 font-mono">test-runner-session.log</span>
                            </div>
                            <button 
                                onClick={() => window.open('http://localhost:5000/tests/test-report.html', '_blank')}
                                className="text-[10px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
                            >
                                <BarChart3 size={12} /> OPEN FULL REPORT
                            </button>
                        </div>
                        <div className="p-4 flex-grow font-mono text-xs text-green-400 overflow-y-auto whitespace-pre-wrap CustomScroll">
                            {logs || '> Waiting for test execution...'}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TestDashboard;
