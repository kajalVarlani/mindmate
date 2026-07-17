import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./services/api";
import { useToast } from "./components/Toast";
import { useAuth } from "./Context/AuthContext";
import "./TherapistRegister.css";

const SPEC_OPTIONS = [
  "Anxiety",
  "Depression",
  "Stress Management",
  "Relationship Counseling",
  "Trauma & PTSD",
  "Self-Esteem Issues",
  "Grief Support",
];

export default function TherapistRegister() {
  const { userName } = useAuth();
  const [name, setName] = useState(userName || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [degreeDoc, setDegreeDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = useToast();
  const navigate = useNavigate();

  const handleSpecChange = (spec) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profilePic || !degreeDoc) {
      showToast("Please upload both your profile photo and degree document.", "warning");
      return;
    }

    if (specializations.length === 0) {
      showToast("Please select at least one specialization.", "warning");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("licenseNumber", licenseNumber);
    formData.append("experience", experience);
    formData.append("bio", bio);
    formData.append("specializations", JSON.stringify(specializations));
    formData.append("profilePic", profilePic);
    formData.append("degreeDoc", degreeDoc);

    try {
      await api.post("/api/therapist/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      showToast("Application submitted! Our team will review your docs.", "success", 5000);
      setTimeout(() => navigate("/therapist/login"), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || "Registration failed. Try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tr-wrapper">
      <div className="tr-card">
        <h2 className="tr-title">Join MindMate as a Therapist</h2>
        <p className="tr-subtitle">Share your expertise and help others on their wellness journey.</p>

        <form onSubmit={handleSubmit} className="tr-form">
          {/* Section 1: Account Information */}
          <fieldset className="tr-section">
            <legend className="tr-section-title">
              <span className="tr-step-num">1</span> Account Details
            </legend>
            <div className="tr-grid">
              <div className="tr-input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Dr. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="tr-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="tr-input-group tr-full-width">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
          </fieldset>

          {/* Section 2: Professional Profile */}
          <fieldset className="tr-section">
            <legend className="tr-section-title">
              <span className="tr-step-num">2</span> Professional Credentials
            </legend>
            <div className="tr-grid">
              <div className="tr-input-group">
                <label>Professional License / Board Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. RCI/12345/PSY or Medical Council Reg No."
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
                <span className="field-hint">Your licensing board registration number (e.g. RCI, State Medical Board).</span>
              </div>

              <div className="tr-input-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                  min="0"
                />
              </div>

              <div className="tr-input-group tr-full-width">
                <label>Professional Biography / Approach</label>
                <textarea
                  placeholder="Tell patients about your background, expertise, and therapeutic approach..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                />
              </div>
            </div>
          </fieldset>

          {/* Section 3: Specializations */}
          <fieldset className="tr-section">
            <legend className="tr-section-title">
              <span className="tr-step-num">3</span> Areas of Expertise
            </legend>
            <div className="tr-input-group">
              <label>Select Your Specializations</label>
              <div className="tr-specs-grid">
                {SPEC_OPTIONS.map((spec) => (
                  <button
                    type="button"
                    key={spec}
                    className={`tr-spec-tag ${specializations.includes(spec) ? "selected" : ""}`}
                    onClick={() => handleSpecChange(spec)}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          {/* Section 4: File Uploads */}
          <fieldset className="tr-section">
            <legend className="tr-section-title">
              <span className="tr-step-num">4</span> Verification Documents
            </legend>
            <div className="tr-files-grid">
              <div className="tr-file-input">
                <label>Professional Headshot Photo</label>
                <span className="field-hint-file">Upload a clear professional headshot (JPG or PNG, neutral background).</span>
                <div className="file-uploader-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePic(e.target.files[0])}
                    required
                  />
                  <span className="file-box-text">
                    {profilePic ? profilePic.name : "📷 Choose Photo"}
                  </span>
                </div>
              </div>

              <div className="tr-file-input">
                <label>Highest Qualification Certificate (PDF/Image)</label>
                <span className="field-hint-file">Upload a scan/proof of your highest degree (MD, M.Phil, or equivalent).</span>
                <div className="file-uploader-box">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setDegreeDoc(e.target.files[0])}
                    required
                  />
                  <span className="file-box-text">
                    {degreeDoc ? degreeDoc.name : "📄 Choose Certificate Document"}
                  </span>
                </div>
              </div>
            </div>
          </fieldset>

          <button type="submit" className="tr-btn" disabled={loading}>
            {loading ? <span className="tr-spinner" /> : "Submit Application"}
          </button>
        </form>

        <div className="tr-footer">
          <p>Already have an approved account? <Link to="/therapist/login">Log in here</Link></p>
        </div>
      </div>
    </div>
  );
}
