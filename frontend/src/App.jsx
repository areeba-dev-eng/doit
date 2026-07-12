import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  ListChecks, CircleCheck, CircleDashed, Flame, Plus, Trash2, X,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:5000/api/tasks";
const PRIORITY_COLORS = { high: "#ff5470", medium: "#ff7a35", low: "#2bd9c3" };

function StatCard({ icon, label, value, accent, delay }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ "--accent": accent }}
    >
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </motion.div>
  );
}

function CompletionRing({ percent }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="ring-card">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} className="ring-track" />
        <motion.circle
          cx="60" cy="60" r={radius}
          className="ring-progress"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-text">
        <span className="ring-percent">{percent}%</span>
        <span className="ring-caption">done</span>
      </div>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchTasks = async () => {
    try {
      setError("");
      const res = await axios.get(API_URL);
      setTasks(res.data);
    } catch (err) {
      setError("Can't reach the backend. Make sure the server is running on port 5000.");
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await axios.post(API_URL, { title, priority });
      setTitle("");
      setPriority("medium");
      setShowForm(false);
      fetchTasks();
    } catch {
      setError("Failed to add task.");
    }
  };

  const toggleComplete = async (task) => {
    try {
      await axios.put(`${API_URL}/${task._id}`, { completed: !task.completed });
      fetchTasks();
    } catch {
      setError("Failed to update task.");
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTasks();
    } catch {
      setError("Failed to delete task.");
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const high = tasks.filter((t) => t.priority === "high" && !t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, high, percent };
  }, [tasks]);

  const chartData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach((t) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({ name: key, value }));
  }, [tasks]);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "completed") return t.completed;
    if (filter === "pending") return !t.completed;
    return true;
  });

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <div>
            <h1>TaskFlow</h1>
            <p>Your day, organized</p>
          </div>
        </div>
        <button className="new-task-btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close" : "New Task"}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <AnimatePresence>
        {showForm && (
          <motion.form
            className="task-form"
            onSubmit={addTask}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <input
              autoFocus
              type="text"
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="submit" className="submit-btn">Add</button>
          </motion.form>
        )}
      </AnimatePresence>

      <section className="stats-row">
        <StatCard icon={<ListChecks size={20} />} label="Total tasks" value={stats.total} accent="#5b8cff" delay={0} />
        <StatCard icon={<CircleDashed size={20} />} label="Pending" value={stats.pending} accent="#ff7a35" delay={0.05} />
        <StatCard icon={<CircleCheck size={20} />} label="Completed" value={stats.completed} accent="#2bd9c3" delay={0.1} />
        <StatCard icon={<Flame size={20} />} label="High priority" value={stats.high} accent="#ff5470" delay={0.15} />
      </section>

      <section className="main-grid">
        <motion.div
          className="panel chart-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3>Priority breakdown</h3>
          {chartData.length === 0 ? (
            <p className="empty-note">Add a task to see the breakdown.</p>
          ) : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1e222b", border: "1px solid #2a2f3a", borderRadius: 8, color: "#f4f1ec" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {chartData.map((d) => (
                  <div key={d.name} className="legend-item">
                    <span className="dot" style={{ background: PRIORITY_COLORS[d.name] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="ring-holder">
            <CompletionRing percent={stats.percent} />
          </div>
        </motion.div>

        <motion.div
          className="panel list-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="list-header">
            <h3>Tasks</h3>
            <div className="filters">
              {["all", "pending", "completed"].map((f) => (
                <button
                  key={f}
                  className={filter === f ? "active" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <ul className="task-list">
            <AnimatePresence>
              {filteredTasks.length === 0 && (
                <motion.p
                  className="empty-note"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Nothing here yet.
                </motion.p>
              )}
              {filteredTasks.map((task) => (
                <motion.li
                  key={task._id}
                  className={`task-item priority-${task.priority}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task)}
                    />
                    <span className={task.completed ? "done" : ""}>{task.title}</span>
                  </label>
                  <div className="task-meta">
                    <span className="badge">{task.priority}</span>
                    <button className="delete-btn" onClick={() => deleteTask(task._id)} aria-label="Delete task">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      </section>
    </div>
  );
}

export default App;
