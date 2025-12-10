// src/pages/Finance.jsx
import React, { useState } from 'react';
import DailyTransactionsTab from '../components/finance/DailyTransactionsTab';
import InvestmentsTab from '../components/finance/InvestmentsTab';
import MonthlySummaryTab from '../components/finance/MonthlySummaryTab';
import { DollarSign, BarChart, TrendingUp } from 'lucide-react';

const tabs = [
    { id: 'investments', name: 'Investments', icon: TrendingUp, component: InvestmentsTab },
    { id: 'daily', name: 'Daily Transactions', icon: DollarSign, component: DailyTransactionsTab },
    { id: 'summary', name: 'Monthly Summary', icon: BarChart, component: MonthlySummaryTab },
];

const Finance = () => {
    const [activeTab, setActiveTab] = useState(tabs[0].id);

    const ActiveComponent = tabs.find(t => t.id === activeTab).component;

    const inactiveTabClasses = 'text-gray-500 hover:text-[rgb(var(--primary))] border-transparent';
    const activeTabClasses = 'text-[rgb(var(--primary))] border-[rgb(var(--primary))] font-semibold';

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Financial Management</h1>

            <div className="border-b border-[rgb(var(--border))]">
                <nav className="flex space-x-8 -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center px-1 py-3 text-lg transition-colors duration-300 border-b-2 
                                ${activeTab === tab.id ? activeTabClasses : inactiveTabClasses}
                            `}
                        >
                            <tab.icon className='w-5 h-5 mr-2' />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <ActiveComponent />
        </div>
    );
};

export default Finance;