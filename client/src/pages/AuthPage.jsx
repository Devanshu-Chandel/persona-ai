import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const inputClass =
  "rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-[15px] outline-none focus:border-violet-500";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) await signup(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-zinc-900 p-7 shadow-xl"
      >
        <h1 className="mb-2 text-2xl font-semibold">
          {isSignup ? "Create account" : "Welcome back"}
        </h1>

        {isSignup && (
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
          />
        )}
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          name="password"
          type="password"
          placeholder="Password (min 6 characters)"
          minLength={6}
          value={form.password}
          onChange={handleChange}
          required
          className={inputClass}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          disabled={loading}
          className="rounded-lg bg-violet-600 px-3 py-2.5 font-medium text-white hover:bg-violet-500 disabled:cursor-default disabled:opacity-60"
        >
          {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
        </button>

        <p className="text-center text-sm text-zinc-400">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link to="/login" className="text-violet-400 hover:underline">
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link to="/signup" className="text-violet-400 hover:underline">
                Sign up
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}