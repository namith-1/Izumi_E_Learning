// v1/frontend/src/pages/InstructorCourse/CourseEditor.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createNewCourse, fetchCourseById, updateCourse } from "../../store";
import {
  Plus,
  Trash2,
  Save,
  BookOpen,
  Clock,
  Layers,
  Video,
  FileText,
  CheckSquare,
  Settings,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Loader2,
  AlertCircle,
  UploadCloud,
  Link,
  X,
} from "lucide-react";
import QuizBuilder from "../../components/QuizBuilder";
import "../css/CourseEditor.css";

// ==========================================
// 1. UTILITIES & CONFIGURATION
// ==========================================
const COURSE_DATA_PATH = "local_course_draft";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const URL_REGEX =
  /^(https?:\/\/)?([\\da-z.-]+)\.([a-z.]{2,6})(\/[\\w .-]*)*\/?$/;

const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

const createNewModule = (type = "text", parentId = null) => ({
  id: generateId(),
  parentId: parentId,
  type: type,
  title:
    type === "intro"
      ? "Course Introduction"
      : `New ${type.charAt(0).toUpperCase() + type.slice(1)} Module`,
  description: "",
  text: type === "text" ? "Start writing your content here..." : "",
  videoLink: type === "video" ? "" : "",
  quizData: { questions: [] },
  children: [],
});

const DEFAULT_PASSING_POLICY = {
  mode: "threshold",
  passingThreshold: 70,
  minimumWeightedScore: 60,
};

const initialCourseStructure = {
  rootModule: createNewModule("intro", null),
  modules: {},
  courseTitle: "Untitled Course",
  courseDescription: "A description for the entire course.",
  subject: "General",
  price: 0,
  passingPolicy: { ...DEFAULT_PASSING_POLICY },
  _id: null,
};

// ─── Helper: compute total weight assigned to graded modules ─────────────────
const computeWeightTotal = (modules) => {
  return Object.values(modules)
    .filter(
      (m) =>
        m && m.isGraded !== false && (m.isGraded === true || m.type === "quiz"),
    )
    .reduce((sum, m) => sum + (Number(m.weight) || 0), 0);
};

// ─── GradingPolicyPanel ───────────────────────────────────────────────────────
const GradingPolicyPanel = ({ policy, onChange, modules }) => {
  const weightTotal = computeWeightTotal(modules);
  const weightOk = Math.abs(weightTotal - 100) < 0.01 || weightTotal === 0;

  return (
    <div className="grading-policy-panel">
      <h4
        style={{
          margin: "0 0 10px",
          fontSize: "13px",
          fontWeight: 700,
          color: "#374151",
        }}
      >
        Grading Policy
      </h4>
      <div className="input-group" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: "12px", color: "#6b7280" }}>
          Grading Mode
        </label>
        <select
          value={policy.mode}
          onChange={(e) => onChange("mode", e.target.value)}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 13,
          }}
        >
          <option value="threshold">Threshold (% of modules done)</option>
          <option value="weighted">Weighted Score</option>
          <option value="all-pass">All Must Pass</option>
        </select>
      </div>
      {policy.mode === "threshold" && (
        <div className="input-group" style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: "#6b7280" }}>
            Min. completion % to pass
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={policy.passingThreshold}
            onChange={(e) =>
              onChange("passingThreshold", Number(e.target.value))
            }
            style={{
              width: "100%",
              padding: "5px 8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          />
        </div>
      )}
      {policy.mode === "weighted" && (
        <>
          <div className="input-group" style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>
              Min. weighted score to pass (0-100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={policy.minimumWeightedScore}
              onChange={(e) =>
                onChange("minimumWeightedScore", Number(e.target.value))
              }
              style={{
                width: "100%",
                padding: "5px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 13,
              }}
            />
          </div>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: weightOk ? "#d1fae5" : "#fef3c7",
              color: weightOk ? "#065f46" : "#92400e",
              marginBottom: 4,
            }}
          >
            {weightOk
              ? `Module weights: ${weightTotal.toFixed(0)} / 100`
              : `Weights total ${weightTotal.toFixed(0)} / 100 — will be auto-normalised`}
          </div>
        </>
      )}
      {policy.mode === "all-pass" && (
        <div style={{ fontSize: 12, color: "#6b7280", padding: "4px 0" }}>
          Every graded module must meet its individual passing score.
        </div>
      )}
    </div>
  );
};

// ─── VideoUploader subcomponent ───────────────────────────────────────────────
// Renders inside the video module editor. Handles both "paste URL" and
// "upload file" modes. Calls onVideoReady(url) when a URL is confirmed.
const VideoUploader = ({ currentUrl, onVideoReady, onError }) => {
  const isCloudinaryUrl = currentUrl && currentUrl.includes("cloudinary");
  const [mode, setMode] = useState(isCloudinaryUrl ? "upload" : "url");
  const [urlInput, setUrlInput] = useState(
    isCloudinaryUrl ? "" : currentUrl || "",
  );
  const [uploadState, setUploadState] = useState({
    progress: 0, // 0-100
    isUploading: false,
    uploadedUrl: isCloudinaryUrl ? currentUrl || "" : "",
    error: null,
    fileName: null,
  });
  const fileInputRef = useRef(null);
  const xhrRef = useRef(null); // so we can abort mid-upload

  // Keep url input in sync if parent changes currentUrl (e.g. switching modules)
  useEffect(() => {
    const isCloudinary = currentUrl && currentUrl.includes("cloudinary");
    const newMode = isCloudinary ? "upload" : "url";
    const newUrlInput = isCloudinary ? "" : currentUrl || "";

    // Defer state updates to avoid triggering cascading renders in strict mode
    const timeoutId = setTimeout(() => {
      setMode(newMode);
      setUrlInput(newUrlInput);
      setUploadState((prev) => ({
        ...prev,
        uploadedUrl: isCloudinary ? currentUrl : "",
        progress: 0,
        isUploading: false,
        error: null,
        fileName: null,
      }));
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [currentUrl]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("video/")) {
      setUploadState((prev) => ({
        ...prev,
        error: "Please select a valid video file.",
      }));
      return;
    }
    const MAX_SIZE_MB = 500;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadState((prev) => ({
        ...prev,
        error: `File exceeds ${MAX_SIZE_MB} MB limit.`,
      }));
      return;
    }

    setUploadState({
      progress: 0,
      isUploading: true,
      uploadedUrl: "",
      error: null,
      fileName: file.name,
    });

    const formData = new FormData();
    formData.append("video", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setUploadState((prev) => ({
          ...prev,
          progress: Math.round((e.loaded / e.total) * 100),
        }));
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.videoUrl) {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            progress: 100,
            uploadedUrl: data.videoUrl,
          }));
          onVideoReady(data.videoUrl);
        } else {
          const msg = data.message || "Upload failed. Please try again.";
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error: msg,
          }));
          onError && onError(msg);
        }
      } catch {
        const msg = "Invalid server response.";
        setUploadState((prev) => ({ ...prev, isUploading: false, error: msg }));
        onError && onError(msg);
      }
    });

    xhr.addEventListener("error", () => {
      const msg = "Network error during upload.";
      setUploadState((prev) => ({ ...prev, isUploading: false, error: msg }));
      onError && onError(msg);
    });

    xhr.addEventListener("abort", () => {
      setUploadState({
        progress: 0,
        isUploading: false,
        uploadedUrl: "",
        error: null,
        fileName: null,
      });
    });

    xhr.open("POST", `${API_BASE}/api/courses/upload-video`);
    xhr.withCredentials = true;
    xhr.send(formData);
  };

  const handleAbort = () => {
    xhrRef.current && xhrRef.current.abort();
  };

  const handleRemoveUpload = () => {
    setUploadState({
      progress: 0,
      isUploading: false,
      uploadedUrl: "",
      error: null,
      fileName: null,
    });
    onVideoReady("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlCommit = (value) => {
    setUrlInput(value);
    onVideoReady(value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Mode toggle */}
      <div
        style={{
          display: "inline-flex",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          overflow: "hidden",
          width: "fit-content",
        }}
      >
        {[
          { key: "url", icon: <Link size={13} />, label: "Paste URL" },
          {
            key: "upload",
            icon: <UploadCloud size={13} />,
            label: "Upload File",
          },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: mode === key ? 600 : 400,
              background: mode === key ? "#4f46e5" : "transparent",
              color: mode === key ? "#fff" : "#6b7280",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── URL Mode ── */}
      {mode === "url" && (
        <div>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => handleUrlCommit(e.target.value)}
            placeholder="https://www.youtube.com/embed/..."
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            Works with YouTube embeds, Vimeo, or any direct video URL.
          </p>
        </div>
      )}

      {/* ── Upload Mode ── */}
      {mode === "upload" && (
        <div>
          {/* Drag-and-drop / file picker zone — only shown when nothing is uploading/done */}
          {!uploadState.isUploading && !uploadState.uploadedUrl && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files[0]);
              }}
              style={{
                border: "2px dashed #c7d2fe",
                borderRadius: 10,
                padding: "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: "#eef2ff",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#818cf8")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#c7d2fe")
              }
            >
              <UploadCloud
                size={28}
                color="#818cf8"
                style={{ marginBottom: 8 }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4f46e5",
                }}
              >
                Click to browse or drag & drop
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>
                MP4, MOV, AVI, MKV — max 500 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {/* Progress bar while uploading */}
          {uploadState.isUploading && (
            <div
              style={{
                border: "1px solid #e0e7ff",
                borderRadius: 10,
                padding: "16px 18px",
                background: "#f5f3ff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2
                    size={15}
                    color="#6366f1"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5" }}
                  >
                    Uploading
                    {uploadState.fileName ? ` "${uploadState.fileName}"` : ""}…
                  </span>
                </div>
                <button
                  onClick={handleAbort}
                  title="Cancel upload"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={15} />
                </button>
              </div>
              {/* Track */}
              <div
                style={{
                  height: 6,
                  background: "#e0e7ff",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${uploadState.progress}%`,
                    background: "linear-gradient(90deg, #6366f1, #818cf8)",
                    borderRadius: 99,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6366f1",
                  marginTop: 4,
                  textAlign: "right",
                }}
              >
                {uploadState.progress}%
              </div>
            </div>
          )}

          {/* Success state — video is uploaded */}
          {!uploadState.isUploading && uploadState.uploadedUrl && (
            <div
              style={{
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: "12px 16px",
                background: "#f0fdf4",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#15803d",
                    }}
                  >
                    ✓ Video uploaded successfully
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                      color: "#6b7280",
                      wordBreak: "break-all",
                      maxWidth: 380,
                    }}
                  >
                    {uploadState.uploadedUrl}
                  </p>
                </div>
                <button
                  onClick={handleRemoveUpload}
                  title="Remove video"
                  style={{
                    background: "#fee2e2",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "#b91c1c",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                    marginLeft: 10,
                  }}
                >
                  <X size={12} /> Remove
                </button>
              </div>

              {/* Inline preview for Cloudinary video URLs */}
              {uploadState.uploadedUrl && (
                <video
                  key={uploadState.uploadedUrl}
                  controls
                  style={{
                    marginTop: 10,
                    width: "100%",
                    borderRadius: 8,
                    maxHeight: 220,
                    background: "#000",
                  }}
                >
                  <source src={uploadState.uploadedUrl} />
                  Your browser does not support video playback.
                </video>
              )}

              {/* Let them replace it */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  background: "none",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "5px 12px",
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                Replace video
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {/* Error */}
          {uploadState.error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                padding: "6px 10px",
                marginTop: 6,
              }}
            >
              <AlertCircle size={13} /> {uploadState.error}
            </div>
          )}
        </div>
      )}

      {/* Inline CSS for the spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── renderModuleIcon ────────────────────────────────────────────────────────
const renderModuleIcon = (type) => {
  const props = { size: 16, className: "module-icon-type" };
  switch (type) {
    case "intro":
      return <BookOpen {...props} />;
    case "text":
      return <FileText {...props} />;
    case "video":
      return <Video {...props} />;
    case "quiz":
      return <CheckSquare {...props} />;
    default:
      return <Layers {...props} />;
  }
};

// ─── deleteModuleFromStructure ────────────────────────────────────────────────
const deleteModuleFromStructure = (modules, moduleId) => {
  const moduleToDelete = modules[moduleId];
  if (!moduleToDelete) return modules;

  const moduleIdsToDelete = [moduleId];
  const findChildrenToDelete = (children) => {
    children.forEach((childId) => {
      moduleIdsToDelete.push(childId);
      if (modules[childId] && modules[childId].children) {
        findChildrenToDelete(modules[childId].children);
      }
    });
  };
  findChildrenToDelete(moduleToDelete.children);

  if (moduleToDelete.parentId && modules[moduleToDelete.parentId]) {
    modules[moduleToDelete.parentId].children = modules[
      moduleToDelete.parentId
    ].children.filter((id) => id !== moduleId);
  }

  const newModules = { ...modules };
  moduleIdsToDelete.forEach((id) => delete newModules[id]);
  return newModules;
};

// ─── ModuleActions ────────────────────────────────────────────────────────────
const ModuleActions = ({ module, onAction, isRoot }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="module-actions-wrapper">
      <button
        className="module-actions-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        title="Options"
      >
        <MoreVertical size={16} />
      </button>
      {isMenuOpen && (
        <div ref={menuRef} className="module-actions-menu">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction("add", module.id);
              setIsMenuOpen(false);
            }}
          >
            <Plus size={14} className="text-green-600" /> Add Sub-Module
          </button>
          {!isRoot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("delete", module.id);
                setIsMenuOpen(false);
              }}
            >
              <Trash2 size={14} className="text-red-600" /> Delete Module
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── ModuleTreeItem ───────────────────────────────────────────────────────────
const ModuleTreeItem = ({
  modules,
  moduleId,
  onSelect,
  onAction,
  selectedId,
  rootId,
  depth = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const module = modules[moduleId];

  if (!module) return null;

  const isSelected = module.id === selectedId;
  const hasChildren = module.children && module.children.length > 0;
  const isRoot = module.id === rootId;

  return (
    <li className="tree-node">
      <div
        className={`module-item ${isSelected ? "active" : ""}`}
        onClick={() => onSelect(module.id)}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <div className="module-title-wrapper">
          <div
            className={`expand-icon ${hasChildren ? "visible" : "hidden"}`}
            onClick={
              hasChildren
                ? (e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }
                : undefined
            }
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </div>
          {renderModuleIcon(module.type)}
          <span className="module-title-text">{module.title}</span>
        </div>
        <ModuleActions module={module} onAction={onAction} isRoot={isRoot} />
      </div>

      {hasChildren && isExpanded && (
        <ul className="module-children-list">
          {module.children.map((childId) => (
            <ModuleTreeItem
              key={childId}
              modules={modules}
              moduleId={childId}
              onSelect={onSelect}
              onAction={onAction}
              selectedId={selectedId}
              rootId={rootId}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// ==========================================
// 3. MAIN COMPONENT (CourseEditor)
// ==========================================
const CourseEditor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courseId } = useParams();

  const { currentCourse } = useSelector((state) => state.courses);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [courseStructure, setCourseStructure] = useState(
    initialCourseStructure,
  );
  const [selectedModuleId, setSelectedModuleId] = useState(
    initialCourseStructure.rootModule.id,
  );
  const [isIntroModuleForm, setIsIntroModuleForm] = useState(true);
  const [isLoadingCourse, setIsLoadingCourse] = useState(!!courseId);
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const allModules = useMemo(
    () => ({
      [courseStructure.rootModule.id]: courseStructure.rootModule,
      ...courseStructure.modules,
    }),
    [courseStructure],
  );

  const selectedModule =
    allModules[selectedModuleId] || courseStructure.rootModule;

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseById(courseId));
    } else {
      const storedData = localStorage.getItem(COURSE_DATA_PATH);
      if (storedData) {
        try {
          const loaded = JSON.parse(storedData);
          if (loaded.rootModule) {
            setCourseStructure(loaded);
            setLastSaved(localStorage.getItem(COURSE_DATA_PATH + "_time"));
            setSelectedModuleId(loaded.rootModule.id);
            setIsIntroModuleForm(true);
          }
        } catch (e) {
          console.error("Error loading draft", e);
        }
      }
    }
  }, [dispatch, courseId]);

  useEffect(() => {
    if (
      courseId &&
      currentCourse &&
      currentCourse._id === courseId &&
      isLoadingCourse
    ) {
      setCourseStructure({
        rootModule: currentCourse.rootModule,
        modules: currentCourse.modules,
        courseTitle: currentCourse.title,
        courseDescription: currentCourse.description,
        subject: currentCourse.subject,
        imageUrl: currentCourse.imageUrl || null,
        price: currentCourse.price || 0,
        passingPolicy: currentCourse.passingPolicy || {
          ...DEFAULT_PASSING_POLICY,
        },
        _id: currentCourse._id,
      });
      setSelectedModuleId(currentCourse.rootModule.id);
      setIsIntroModuleForm(true);
      setIsLoadingCourse(false);
      setLastSaved(new Date().toISOString());
      if (currentCourse.imageUrl) setImagePreviewUrl(currentCourse.imageUrl);
    }
  }, [courseId, currentCourse, isLoadingCourse]);

  // ─── Draft save ──────────────────────────────────────────────────────────────
  const saveDraft = useCallback(
    (structure) => {
      if (!courseId) {
        setIsSaving(true);
        localStorage.setItem(COURSE_DATA_PATH, JSON.stringify(structure));
        localStorage.setItem(
          COURSE_DATA_PATH + "_time",
          new Date().toISOString(),
        );
        setTimeout(() => setIsSaving(false), 500);
        setLastSaved(new Date().toISOString());
      }
    },
    [courseId],
  );

  useEffect(() => {
    const timer = setTimeout(() => saveDraft(courseStructure), 60000);
    return () => clearTimeout(timer);
  }, [courseStructure, saveDraft]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleSelectModule = (id) => {
    setSelectedModuleId(id);
    setIsIntroModuleForm(id === courseStructure.rootModule.id);
    setValidationErrors((prev) => {
      const n = { ...prev };
      delete n.moduleTitle;
      delete n.videoLink;
      return n;
    });
  };

  const handleAddModule = useCallback(
    (parentId) => {
      const parentModule = allModules[parentId];
      if (!parentModule) return;

      const newModule = createNewModule("text", parentId);
      const updatedParent = {
        ...parentModule,
        children: [...parentModule.children, newModule.id],
      };

      setCourseStructure((prev) => {
        const newModulesMap = { ...prev.modules };
        newModulesMap[newModule.id] = newModule;

        let nextState;
        if (parentId === prev.rootModule.id) {
          nextState = {
            ...prev,
            rootModule: updatedParent,
            modules: newModulesMap,
          };
        } else {
          newModulesMap[parentId] = updatedParent;
          nextState = { ...prev, modules: newModulesMap };
        }
        saveDraft(nextState);
        return nextState;
      });

      setSelectedModuleId(newModule.id);
      setIsIntroModuleForm(false);
    },
    [allModules, saveDraft],
  );

  const handleDeleteModule = useCallback(
    (moduleId) => {
      if (moduleId === courseStructure.rootModule.id) {
        alert("Cannot delete the root module.");
        return;
      }
      if (window.confirm("Delete this module and ALL sub-modules?")) {
        const updatedModules = deleteModuleFromStructure(allModules, moduleId);
        const moduleToDelete = allModules[moduleId];
        const parentId = moduleToDelete.parentId;

        let updatedRoot = { ...courseStructure.rootModule };

        if (parentId === courseStructure.rootModule.id) {
          updatedRoot.children = updatedRoot.children.filter(
            (id) => id !== moduleId,
          );
        } else if (updatedModules[parentId]) {
          updatedModules[parentId] = {
            ...updatedModules[parentId],
            children: updatedModules[parentId].children.filter(
              (id) => id !== moduleId,
            ),
          };
        }
        delete updatedModules[courseStructure.rootModule.id];

        const newModulesMap = Object.keys(updatedModules).reduce((acc, key) => {
          if (key !== updatedRoot.id) acc[key] = updatedModules[key];
          return acc;
        }, {});

        const newStructure = {
          ...courseStructure,
          modules: newModulesMap,
          rootModule: updatedRoot,
        };
        setCourseStructure(newStructure);
        saveDraft(newStructure);
        setSelectedModuleId(courseStructure.rootModule.id);
        setIsIntroModuleForm(true);
      }
    },
    [allModules, courseStructure, saveDraft],
  );

  const handleModuleAction = (action, moduleId) => {
    if (action === "add") handleAddModule(moduleId);
    if (action === "delete") handleDeleteModule(moduleId);
  };

  const handleModuleFormChange = (field, value) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
    if (field === "title" && validationErrors.moduleTitle) {
      setValidationErrors((prev) => {
        const n = { ...prev };
        delete n.moduleTitle;
        return n;
      });
    }

    setCourseStructure((prev) => {
      const targetId = selectedModuleId;
      const isRoot = targetId === prev.rootModule.id;
      const currentModule = isRoot ? prev.rootModule : prev.modules[targetId];
      if (!currentModule) return prev;

      const newModuleData = { ...currentModule, [field]: value };
      let nextState;
      if (isRoot) {
        nextState = { ...prev, rootModule: newModuleData };
      } else {
        nextState = {
          ...prev,
          modules: { ...prev.modules, [targetId]: newModuleData },
        };
      }
      saveDraft(nextState);
      return nextState;
    });
  };

  const handleCourseMetaChange = (field, value) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
    setCourseStructure((prev) => {
      const nextState = { ...prev, [field]: value };
      saveDraft(nextState);
      return nextState;
    });
  };

  // ─── Image upload ────────────────────────────────────────────────────────────
  const handleImageSelect = (file) => {
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const uploadImageToServer = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`${API_BASE}/api/courses/upload-image`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403)
        throw new Error(
          "Authentication required. Please log in as an instructor.",
        );
      throw new Error(data.message || "Upload failed");
    }
    return data.imageUrl;
  };

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validateEntireCourse = () => {
    const errors = {};

    if (!courseStructure.courseTitle.trim())
      errors.courseTitle = "Course Title is required.";
    if (!courseStructure.subject.trim())
      errors.subject = "Subject is required.";
    if (courseStructure.price < 0 || isNaN(courseStructure.price))
      errors.price = "Price must be a non-negative number.";

    const allModulesList = Object.values(allModules);
    const moduleIssues = [];

    for (const mod of allModulesList) {
      if (!mod || !mod.id) continue;
      if (!mod.title || !mod.title.trim())
        moduleIssues.push(
          `Module "${mod.id.substring(0, 8)}..." has no title.`,
        );
      if (
        mod.type === "video" &&
        (!mod.videoLink || !URL_REGEX.test(mod.videoLink))
      )
        moduleIssues.push(
          `"${mod.title || "Untitled"}" (video) needs a valid URL.`,
        );
      if (
        mod.type === "quiz" &&
        (!mod.quizData?.questions || mod.quizData.questions.length === 0)
      )
        moduleIssues.push(
          `"${mod.title || "Untitled"}" (quiz) has no questions.`,
        );
    }
    if (moduleIssues.length > 0) errors.moduleIssues = moduleIssues;

    const policy = courseStructure.passingPolicy;
    if (policy?.mode === "weighted") {
      const weightTotal = computeWeightTotal(courseStructure.modules);
      if (weightTotal > 0 && Math.abs(weightTotal - 100) > 0.01)
        errors.weightWarning = `Graded module weights sum to ${weightTotal.toFixed(0)}, not 100. Scores will be auto-normalised.`;
    }

    if (!selectedModule.title.trim())
      errors.moduleTitle = "Module Title is required.";
    if (
      selectedModule.type === "video" &&
      (!selectedModule.videoLink || !URL_REGEX.test(selectedModule.videoLink))
    )
      errors.videoLink = "A valid Video URL is required.";
    if (
      selectedModule.type === "quiz" &&
      (!selectedModule.quizData?.questions ||
        selectedModule.quizData.questions.length === 0)
    )
      errors.quizData = "Quiz must have at least one question.";

    setValidationErrors(errors);
    return errors;
  };

  // ─── Publish / Update ────────────────────────────────────────────────────────
  const handlePublishCourse = async () => {
    const errors = validateEntireCourse();
    const blockingKeys = Object.keys(errors).filter(
      (k) => k !== "weightWarning",
    );

    if (blockingKeys.length > 0) {
      let msg = "Please fix these issues before publishing:\n\n";
      if (errors.courseTitle) msg += `• ${errors.courseTitle}\n`;
      if (errors.subject) msg += `• ${errors.subject}\n`;
      if (errors.moduleIssues) {
        msg += "\nModule issues:\n";
        errors.moduleIssues.forEach((issue) => {
          msg += `• ${issue}\n`;
        });
      }
      if (errors.moduleTitle)
        msg += `• Current module: ${errors.moduleTitle}\n`;
      if (errors.videoLink) msg += `• Current module: ${errors.videoLink}\n`;
      if (errors.quizData) msg += `• Current module: ${errors.quizData}\n`;
      alert(msg);
      return;
    }

    if (errors.weightWarning) {
      if (!window.confirm(`⚠️ ${errors.weightWarning}\n\nProceed anyway?`))
        return;
    }

    const isEditing = !!courseId;
    const actionText = isEditing ? "Update" : "Publish";

    if (window.confirm(`${actionText} this course?`)) {
      setIsSaving(true);
      try {
        const payload = {
          courseTitle: courseStructure.courseTitle,
          courseDescription: courseStructure.courseDescription,
          subject: courseStructure.subject,
          price: Number(courseStructure.price) || 0,
          rootModule: courseStructure.rootModule,
          modules: courseStructure.modules,
          imageUrl: courseStructure.imageUrl || null,
          passingPolicy:
            courseStructure.passingPolicy || DEFAULT_PASSING_POLICY,
        };

        if (selectedImageFile) {
          try {
            payload.imageUrl = await uploadImageToServer(selectedImageFile);
            setImagePreviewUrl(payload.imageUrl);
          } catch {
            alert("Image upload failed. Please try again.");
            setIsSaving(false);
            return;
          }
        }

        // Note: video files are uploaded immediately on selection (inside VideoUploader),
        // so by publish time courseStructure already holds the final Cloudinary URL.
        // No extra upload step needed here.

        let result;
        if (isEditing) {
          result = await dispatch(
            updateCourse({ id: courseId, data: payload }),
          );
          if (updateCourse.fulfilled.match(result)) {
            const ww = result.payload?.weightWarning;
            alert(`Course updated successfully!${ww ? `\n\n⚠️ ${ww}` : ""}`);
            navigate("/instructor-dashboard");
          } else {
            alert(`Update failed: ${result.payload}`);
          }
        } else {
          result = await dispatch(createNewCourse(payload));
          if (createNewCourse.fulfilled.match(result)) {
            localStorage.removeItem(COURSE_DATA_PATH);
            const ww = result.payload?.weightWarning;
            if (ww) alert(`Course published!\n\n⚠️ ${ww}`);
            navigate("/instructor-dashboard");
          } else {
            alert(`Publish failed: ${result.payload}`);
          }
        }
      } catch (e) {
        console.error(e);
        alert(`An error occurred during ${actionText.toLowerCase()}.`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // ─── Loading guard ───────────────────────────────────────────────────────────
  if (courseId && isLoadingCourse) {
    return (
      <div className="loading-state-full">
        <Loader2 className="animate-spin" size={32} /> Loading course for
        editing...
      </div>
    );
  }

  const publishButtonText = courseId ? "Update Course" : "Publish Course";

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="course-editor-app">
      {/* SIDEBAR */}
      <div className="module-tree-sidebar">
        <div className="editor-header">
          <h2>Course Builder</h2>
          <Settings
            size={18}
            className="icon-btn"
            onClick={() => handleSelectModule(courseStructure.rootModule.id)}
          />
        </div>

        <div className="save-course-bar">
          <div className="input-group">
            <label className="image-upload-label">Course Image</label>
            <div className="image-upload-row">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e.target.files[0])}
              />
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt="preview"
                  className="image-preview-small"
                />
              )}
            </div>
          </div>

          <div className="input-group">
            <input
              type="text"
              className={`sidebar-input ${validationErrors.courseTitle ? "input-error" : ""}`}
              placeholder="Course Title *"
              value={courseStructure.courseTitle}
              onChange={(e) =>
                handleCourseMetaChange("courseTitle", e.target.value)
              }
            />
            {validationErrors.courseTitle && (
              <span className="error-tooltip">
                {validationErrors.courseTitle}
              </span>
            )}
          </div>

          <div className="input-group">
            <label
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
                display: "block",
              }}
            >
              Course Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={`sidebar-input ${validationErrors.price ? "input-error" : ""}`}
              placeholder="0.00 (Free)"
              value={courseStructure.price}
              onChange={(e) => handleCourseMetaChange("price", e.target.value)}
            />
            {validationErrors.price && (
              <span className="error-tooltip">{validationErrors.price}</span>
            )}
          </div>

          <div className="input-group">
            <input
              type="text"
              className={`sidebar-input ${validationErrors.subject ? "input-error" : ""}`}
              placeholder="Subject *"
              value={courseStructure.subject}
              onChange={(e) =>
                handleCourseMetaChange("subject", e.target.value)
              }
            />
            {validationErrors.subject && (
              <span className="error-tooltip">{validationErrors.subject}</span>
            )}
          </div>

          <button
            onClick={handlePublishCourse}
            disabled={isSaving}
            className="btn-publish-course"
          >
            <Save size={16} /> {publishButtonText}
          </button>

          <GradingPolicyPanel
            policy={courseStructure.passingPolicy || DEFAULT_PASSING_POLICY}
            modules={courseStructure.modules}
            onChange={(field, val) =>
              setCourseStructure((prev) => ({
                ...prev,
                passingPolicy: {
                  ...(prev.passingPolicy || DEFAULT_PASSING_POLICY),
                  [field]: val,
                },
              }))
            }
          />
        </div>

        <div className="tree-container">
          <ul className="module-tree-list">
            <ModuleTreeItem
              modules={allModules}
              moduleId={courseStructure.rootModule.id}
              onSelect={handleSelectModule}
              onAction={handleModuleAction}
              selectedId={selectedModuleId}
              rootId={courseStructure.rootModule.id}
            />
          </ul>
        </div>
      </div>

      {/* EDITOR AREA */}
      <div className="module-editor-content">
        <div
          className="course-image-preview-banner"
          style={{
            height: "420px",
            marginBottom: "18px",
            backgroundColor: "#f3f4f6",
            backgroundImage: imagePreviewUrl
              ? `url(${(imagePreviewUrl || "").startsWith("http") ? imagePreviewUrl : `${API_BASE}${imagePreviewUrl}`})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "6px",
          }}
        />
        <div className="module-editor-card">
          <div className="card-header">
            <h2>{isIntroModuleForm ? "Course Settings" : "Edit Module"}</h2>
            <span className="module-id-badge">ID: {selectedModule.title}</span>
          </div>

          <div className="form-field">
            <label>
              Title <span className="required-star">*</span>
            </label>
            <input
              type="text"
              className={validationErrors.moduleTitle ? "input-error" : ""}
              value={selectedModule.title}
              onChange={(e) => handleModuleFormChange("title", e.target.value)}
            />
            {validationErrors.moduleTitle && (
              <span className="error-text">
                <AlertCircle size={12} /> {validationErrors.moduleTitle}
              </span>
            )}
          </div>

          {!isIntroModuleForm ? (
            <>
              {/* Per-module grading settings */}
              {(selectedModule.type === "quiz" ||
                selectedModule.type === "video" ||
                selectedModule.type === "text") && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    padding: "12px 14px",
                    marginBottom: 16,
                  }}
                >
                  <h5
                    style={{
                      margin: "0 0 10px",
                      fontSize: 13,
                      color: "#166534",
                      fontWeight: 700,
                    }}
                  >
                    Module Grading
                  </h5>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      marginBottom: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModule.isGraded !== false}
                      onChange={(e) =>
                        handleModuleFormChange("isGraded", e.target.checked)
                      }
                    />
                    <span>Count toward course grade</span>
                  </label>
                  {selectedModule.isGraded !== false && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginTop: 6,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Weight (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="e.g. 25"
                          value={selectedModule.weight ?? ""}
                          onChange={(e) =>
                            handleModuleFormChange(
                              "weight",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "5px 8px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 13,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Passing Score (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="e.g. 60"
                          value={selectedModule.passingScore ?? ""}
                          onChange={(e) =>
                            handleModuleFormChange(
                              "passingScore",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "5px 8px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 13,
                          }}
                        />
                      </div>
                      {selectedModule.type === "quiz" && (
                        <div style={{ gridColumn: "span 2" }}>
                          <label
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Max Attempts (blank = unlimited)
                          </label>
                          <input
                            type="number"
                            min={1}
                            placeholder="Unlimited"
                            value={selectedModule.maxAttempts ?? ""}
                            onChange={(e) =>
                              handleModuleFormChange(
                                "maxAttempts",
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "5px 8px",
                              borderRadius: 6,
                              border: "1px solid #d1d5db",
                              fontSize: 13,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="form-grid">
                <div className="form-field">
                  <label>Type</label>
                  <select
                    value={selectedModule.type}
                    onChange={(e) => {
                      handleModuleFormChange("type", e.target.value);
                      const def = createNewModule(e.target.value);
                      handleModuleFormChange("text", def.text);
                      handleModuleFormChange("videoLink", def.videoLink);
                      if (e.target.value === "quiz")
                        handleModuleFormChange("quizData", { questions: [] });
                      setValidationErrors((prev) => {
                        const n = { ...prev };
                        delete n.videoLink;
                        delete n.quizData;
                        return n;
                      });
                    }}
                  >
                    <option value="text">Text Lesson</option>
                    <option value="video">Video Lesson</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Description</label>
                  <input
                    type="text"
                    value={selectedModule.description}
                    onChange={(e) =>
                      handleModuleFormChange("description", e.target.value)
                    }
                    placeholder="Short summary..."
                  />
                </div>
              </div>

              {/* Text module */}
              {selectedModule.type === "text" && (
                <div className="form-field">
                  <label>Content</label>
                  <textarea
                    rows="12"
                    value={selectedModule.text}
                    onChange={(e) =>
                      handleModuleFormChange("text", e.target.value)
                    }
                  />
                </div>
              )}

              {/* ── Video module — now uses VideoUploader ── */}
              {selectedModule.type === "video" && (
                <div className="form-field">
                  <label>
                    Video <span className="required-star">*</span>
                  </label>
                  <VideoUploader
                    // key forces a fresh instance when switching to a different module
                    key={selectedModuleId}
                    currentUrl={selectedModule.videoLink || ""}
                    onVideoReady={(url) => {
                      handleModuleFormChange("videoLink", url);
                      // Clear any stale validation error for this field
                      if (validationErrors.videoLink) {
                        setValidationErrors((prev) => {
                          const n = { ...prev };
                          delete n.videoLink;
                          return n;
                        });
                      }
                    }}
                    onError={(msg) => console.error("Video upload error:", msg)}
                  />
                  {validationErrors.videoLink && (
                    <span className="error-text" style={{ marginTop: 6 }}>
                      <AlertCircle size={12} /> {validationErrors.videoLink}
                    </span>
                  )}
                </div>
              )}

              {/* Quiz module */}
              {selectedModule.type === "quiz" && (
                <div className="form-field">
                  <QuizBuilder
                    quizData={selectedModule.quizData || { questions: [] }}
                    onChange={(newData) =>
                      handleModuleFormChange("quizData", newData)
                    }
                  />
                  {validationErrors.quizData && (
                    <div className="error-banner">
                      <AlertCircle size={14} /> {validationErrors.quizData}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="form-field">
              <label>Course Description</label>
              <textarea
                rows="6"
                value={courseStructure.courseDescription}
                onChange={(e) =>
                  handleCourseMetaChange("courseDescription", e.target.value)
                }
                placeholder="Describe the course..."
              />
            </div>
          )}

          <div className="editor-footer">
            <button
              className="btn-add-child"
              onClick={() => handleAddModule(selectedModuleId)}
            >
              <Plus size={16} /> Add Sub-Module
            </button>
            {!isIntroModuleForm && (
              <button
                className="btn-delete-module"
                onClick={() => handleDeleteModule(selectedModuleId)}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <div className="autosave-status">
              <Clock size={14} />
              <span>
                {isSaving
                  ? "Saving..."
                  : `Draft saved: ${lastSaved ? new Date(lastSaved).toLocaleTimeString() : "Just now"}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;
