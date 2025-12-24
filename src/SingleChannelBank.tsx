import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, User, CreditCard, Clock, Activity, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Tipe data untuk Pelanggan
 */
interface Customer {
    id: number;
    arrivalTime: number; // Waktu masuk sistem
    serviceDuration: number; // Berapa lama butuh dilayani (detik)
    startServiceTime?: number; // Kapan mulai dilayani
    color: string; // Warna visual
}

/**
 * Tipe data untuk Statistik
 */
interface Stats {
    totalServed: number;
    totalWaitTime: number; // Total waktu tunggu dalam antrean (sebelum dilayani)
    totalSystemTime: number; // Total waktu dalam sistem (antre + layanan)
    busyTime: number; // Total waktu teller sibuk
}

const COLORS = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];

const SingleChannelBank = () => {
    // --- KONFIGURASI STATE ---
    const [isRunning, setIsRunning] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(1); // Multiplier kecepatan
    const [arrivalRate, setArrivalRate] = useState(4); // Pelanggan per menit (Lambda)
    const [serviceRate, setServiceRate] = useState(5); // Pelanggan per menit (Mu)

    // --- STATE SIMULASI ---
    const [time, setTime] = useState(0); // Waktu simulasi dalam detik
    const [queue, setQueue] = useState<Customer[]>([]);
    const [tellerCustomer, setTellerCustomer] = useState<Customer | null>(null);

    // --- STATISTIK ---
    const [stats, setStats] = useState<Stats>({
        totalServed: 0,
        totalWaitTime: 0,
        totalSystemTime: 0,
        busyTime: 0
    });

    // Data untuk grafik (disimpan dalam array terbatas agar tidak berat)
    const [chartData, setChartData] = useState<{ time: string; length: number }[]>([]);

    // Refs untuk logika loop agar tidak terkena closure trap di useEffect
    const stateRef = useRef({
        time: 0,
        queue: [] as Customer[],
        tellerCustomer: null as Customer | null,
        nextArrival: 0, // Waktu kedatangan berikutnya
        nextDeparture: Infinity, // Waktu keberangkatan (selesai layanan) berikutnya
        customerIdCounter: 1,
        stats: { totalServed: 0, totalWaitTime: 0, totalSystemTime: 0, busyTime: 0 }
    });

    // --- FUNGSI UTILITAS MATEMATIKA ---

    // Menghasilkan angka acak berdasarkan distribusi eksponensial
    // Digunakan untuk menentukan interval antar kedatangan dan durasi layanan
    const getExponentialRandom = (ratePerMinute: number) => {
        const ratePerSecond = ratePerMinute / 60;
        // Rumus: -ln(U) / lambda
        return -Math.log(Math.random()) / ratePerSecond;
    };

    // --- LOGIKA SIMULASI INTI ---

    const resetSimulation = () => {
        setIsRunning(false);
        setTime(0);
        setQueue([]);
        setTellerCustomer(null);
        setChartData([]);
        setStats({
            totalServed: 0,
            totalWaitTime: 0,
            totalSystemTime: 0,
            busyTime: 0
        });

        // Reset Ref
        stateRef.current = {
            time: 0,
            queue: [],
            tellerCustomer: null,
            nextArrival: getExponentialRandom(arrivalRate),
            nextDeparture: Infinity,
            customerIdCounter: 1,
            stats: { totalServed: 0, totalWaitTime: 0, totalSystemTime: 0, busyTime: 0 }
        };
    };

    useEffect(() => {
        let animationFrameId: number;
        let lastTimestamp = performance.now();

        const gameLoop = (timestamp: number) => {
            if (!isRunning) return;

            const deltaRealTime = (timestamp - lastTimestamp) / 1000; // detik nyata yang berlalu
            lastTimestamp = timestamp;

            // Hitung delta waktu simulasi
            const dt = deltaRealTime * simulationSpeed;

            const current = stateRef.current;
            current.time += dt;

            // 1. LOGIKA KEDATANGAN (Arrival)
            if (current.time >= current.nextArrival) {
                // Buat pelanggan baru
                const newCustomer: Customer = {
                    id: current.customerIdCounter++,
                    arrivalTime: current.nextArrival, // Tepat saat seharusnya datang
                    serviceDuration: getExponentialRandom(serviceRate),
                    color: COLORS[Math.floor(Math.random() * COLORS.length)]
                };

                // Jika Teller kosong, langsung masuk teller
                if (!current.tellerCustomer) {
                    current.tellerCustomer = newCustomer;
                    newCustomer.startServiceTime = current.time;
                    // Set kapan dia akan selesai
                    current.nextDeparture = current.time + newCustomer.serviceDuration;
                } else {
                    // Jika Teller sibuk, masuk antrean
                    current.queue.push(newCustomer);
                }

                // Jadwalkan kedatangan berikutnya
                current.nextArrival += getExponentialRandom(arrivalRate);
            }

            // 2. LOGIKA PELAYANAN (Service)
            // Cek apakah pelanggan di teller sudah selesai
            if (current.tellerCustomer && current.time >= current.nextDeparture) {
                const finishedCustomer = current.tellerCustomer;

                // Update Statistik
                const waitTime = (finishedCustomer.startServiceTime || 0) - finishedCustomer.arrivalTime;
                const systemTime = current.time - finishedCustomer.arrivalTime;

                current.stats.totalServed += 1;
                current.stats.totalWaitTime += waitTime;
                current.stats.totalSystemTime += systemTime;
                current.stats.busyTime += finishedCustomer.serviceDuration;

                // Keluarkan pelanggan (selesai)
                current.tellerCustomer = null;

                // Cek antrean untuk pelanggan berikutnya
                if (current.queue.length > 0) {
                    const nextCustomer = current.queue.shift(); // Ambil dari depan antrean
                    if (nextCustomer) {
                        current.tellerCustomer = nextCustomer;
                        nextCustomer.startServiceTime = current.time;
                        current.nextDeparture = current.time + nextCustomer.serviceDuration;
                    }
                } else {
                    // Tidak ada yang mengantre
                    current.nextDeparture = Infinity;
                }
            }

            // 3. UPDATE STATE REACT (Throttle untuk performa UI)
            // Kita update UI state setiap frame, tapi React akan memprosesnya seefisien mungkin
            setTime(current.time);
            setQueue([...current.queue]);
            setTellerCustomer(current.tellerCustomer ? { ...current.tellerCustomer } : null);
            setStats({ ...current.stats });

            // Update Chart Data (setiap 1 detik simulasi kira-kira, atau setiap frame tapi di filter)
            // Untuk simplifikasi, kita tambahkan data jika integer waktu berubah
            if (Math.floor(current.time) > Math.floor(current.time - dt)) {
                setChartData(prev => {
                    const newData = [...prev, {
                        time: Math.floor(current.time).toString(),
                        length: current.queue.length
                    }];
                    // Keep only last 20 points
                    if (newData.length > 30) return newData.slice(newData.length - 30);
                    return newData;
                });
            }

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        if (isRunning) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isRunning, simulationSpeed, arrivalRate, serviceRate]);


    // --- PERHITUNGAN METRIK RATA-RATA ---
    const avgWaitTime = stats.totalServed > 0 ? (stats.totalWaitTime / stats.totalServed).toFixed(2) : "0.00";
    const utilization = time > 0 ? ((stats.busyTime / time) * 100).toFixed(1) : "0.0";
    const avgSystemTime = stats.totalServed > 0 ? (stats.totalSystemTime / stats.totalServed).toFixed(2) : "0.00";

    // Teori (M/M/1 Formulas)
    // Rho = Lambda / Mu
    const rho = arrivalRate / serviceRate;
    const theoreticalAvgWait = rho < 1 ? (rho / (serviceRate / 60 - arrivalRate / 60) / 60).toFixed(2) : "∞";
    // (Rumus di atas disederhanakan untuk rate/menit ke detik display)

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">

            {/* HEADER */}
            <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="text-blue-600" />
                        Simulasi Antrean Bank
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Model Saluran Tunggal (Single-Channel M/M/1)</p>
                </div>

                <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    >
                        {isRunning ? <><Pause size={18} /> Jeda</> : <><Play size={18} /> Mulai</>}
                    </button>
                    <button
                        onClick={resetSimulation}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* KONTROL PARAMETER (KIRI) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-slate-400" />
                        Pengaturan
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Laju Kedatangan (λ)
                            </label>
                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                <span>Sepi</span>
                                <span>Ramai</span>
                            </div>
                            <input
                                type="range" min="1" max="15" step="0.5"
                                value={arrivalRate}
                                onChange={(e) => {
                                    setArrivalRate(Number(e.target.value));
                                    // Update ref immediately for smoother response
                                    // Note: next arrival time is already scheduled, so change applies to subsequent one
                                }}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="mt-1 text-center font-mono text-blue-600 font-bold bg-blue-50 py-1 rounded">
                                {arrivalRate} orang/menit
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Laju Pelayanan (μ)
                            </label>
                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                <span>Lambat</span>
                                <span>Cepat</span>
                            </div>
                            <input
                                type="range" min="1" max="15" step="0.5"
                                value={serviceRate}
                                onChange={(e) => setServiceRate(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <div className="mt-1 text-center font-mono text-emerald-600 font-bold bg-emerald-50 py-1 rounded">
                                {serviceRate} orang/menit
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Kecepatan Simulasi
                            </label>
                            <div className="flex gap-2">
                                {[1, 5, 20].map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => setSimulationSpeed(speed)}
                                        className={`flex-1 py-1 text-xs rounded border ${simulationSpeed === speed ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-100 p-3 rounded text-xs text-slate-600 space-y-1">
                            <p><strong>Intensitas Trafik (ρ):</strong> {(arrivalRate / serviceRate).toFixed(2)}</p>
                            <p>{arrivalRate / serviceRate >= 1 ? "⚠️ Antrean akan terus bertambah (Tidak Stabil)" : "✅ Sistem Stabil"}</p>
                        </div>
                    </div>
                </div>

                {/* VISUALISASI (TENGAH) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* AREA BANK */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden min-h-[300px]">
                        <div className="absolute top-3 right-3 text-slate-400 font-mono text-xs">
                            Waktu: {Math.floor(time)}s
                        </div>

                        <div className="flex flex-col h-full justify-center">

                            {/* TELLER AREA */}
                            <div className="flex items-center mb-12 relative">
                                <div className="w-24 flex-shrink-0 flex flex-col items-center z-10">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-colors duration-300 ${tellerCustomer ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                                        <CreditCard size={28} />
                                    </div>
                                    <span className="mt-2 font-bold text-sm text-slate-700">Teller</span>
                                    <span className="text-xs text-slate-500">{tellerCustomer ? 'Sibuk' : 'Tersedia'}</span>
                                </div>

                                {/* CUSTOMER BEING SERVED */}
                                <div className="w-32 h-32 flex items-center justify-center relative">
                                    {tellerCustomer && (
                                        <div className={`absolute transition-all duration-300 transform scale-100 ${tellerCustomer.color} text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg`}>
                                            <User size={20} />
                                            {/* Progress bar pelayanan */}
                                            <div className="absolute -bottom-4 w-12 h-1 bg-slate-200 rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-75"
                                                    style={{ width: `${Math.min(100, ((time - (tellerCustomer.startServiceTime || 0)) / tellerCustomer.serviceDuration) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* GARIS BATAS */}
                                <div className="h-full absolute left-36 border-l-2 border-dashed border-slate-300 top-0 bottom-0" />
                            </div>

                            {/* QUEUE AREA */}
                            <div className="relative pt-4">
                                <div className="absolute -top-6 left-0 text-xs font-semibold text-slate-400 uppercase tracking-wider">Antrean ({queue.length})</div>
                                <div className="flex flex-row-reverse justify-end gap-3 min-h-[60px] overflow-x-auto pb-2 items-center">
                                    {queue.length === 0 && (
                                        <span className="text-slate-400 text-sm italic ml-4">Antrean kosong...</span>
                                    )}
                                    {queue.map((cust, idx) => (
                                        <div
                                            key={cust.id}
                                            className={`flex-shrink-0 ${cust.color} text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md animate-in fade-in slide-in-from-right-4 duration-300`}
                                        >
                                            <span className="text-xs font-bold">{idx + 1}</span>
                                        </div>
                                    ))}
                                    {/* Placeholder for incoming */}
                                    <div className="w-10 opacity-0"></div>
                                </div>
                                <div className="h-1 bg-slate-100 w-full mt-2 rounded"></div>
                            </div>

                        </div>
                    </div>

                    {/* DASHBOARD BAWAH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* STATISTIK */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                <Activity size={16} /> Metrik Kinerja
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-2xl font-bold text-slate-800">{stats.totalServed}</div>
                                    <div className="text-xs text-slate-500">Pelanggan Dilayani</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-2xl font-bold text-blue-600">{avgWaitTime}s</div>
                                    <div className="text-xs text-slate-500">Rata-rata Waktu Tunggu</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-2xl font-bold text-emerald-600">{utilization}%</div>
                                    <div className="text-xs text-slate-500">Utilisasi Teller</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-2xl font-bold text-purple-600">{queue.length}</div>
                                    <div className="text-xs text-slate-500">Panjang Antrean Saat Ini</div>
                                </div>
                            </div>
                        </div>

                        {/* CHART */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <Users size={16} /> Grafik Antrean (Real-time)
                            </h3>
                            <div className="flex-1 min-h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis allowDecimals={false} width={30} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ display: 'none' }}
                                            formatter={(value: number) => [`${value} Orang`, 'Antrean']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="length"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                            isAnimationActive={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleChannelBank;