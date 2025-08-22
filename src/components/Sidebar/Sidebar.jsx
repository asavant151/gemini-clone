import React, { useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";

const Sidebar = () => {
  const [extended, setExtended] = useState(false);
  const { onSent, prevPrompt, setPrevPrompt, setRecentPrompt, newChat } =
    React.useContext(Context);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  const loadPrompt = async (prompt) => {
    setRecentPrompt(prompt);
    await onSent(prompt);
  };

  const beginEdit = (e, index, text) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditingText(text);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const value = editingText.trim();
    if (!value) {
      // If cleared, treat as delete
      setPrevPrompt((prev) => prev.filter((_, i) => i !== editingIndex));
    } else {
      setPrevPrompt((prev) =>
        prev.map((p, i) => (i === editingIndex ? value : p))
      );
    }
    setEditingIndex(null);
    setEditingText("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const onEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const deleteItem = (e, index) => {
    e.stopPropagation();
    setPrevPrompt((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  return (
    <div className="sidebar">
      <div className="top">
        <img
          src={assets.menu_icon}
          alt=""
          className="menu"
          onClick={() => setExtended((prev) => !prev)}
        />
        <div className="new-chat" onClick={() => newChat()}>
          <img src={assets.plus_icon} alt="" />
          {extended ? <p>New Chat</p> : null}
        </div>
        {extended ? (
          <div className="recent">
            <p className="recent-title">Recent</p>
            {prevPrompt?.map((item, index) => {
              const isEditing = editingIndex === index;
              return (
                <div
                  className="recent-entry"
                  key={index}
                  onClick={() => !isEditing && loadPrompt(item)}
                  title={item}
                >
                  <img src={assets.message_icon} alt="" />
                  {isEditing ? (
                    <input
                      className="recent-edit-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={onEditKeyDown}
                      onBlur={saveEdit}
                      autoFocus
                    />
                  ) : (
                    <p>{item.length > 24 ? item.slice(0, 24) + "..." : item}</p>
                  )}
                  {!isEditing && (
                    <div
                      className="entry-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="icon-btn"
                        aria-label="Edit recent"
                        title="Edit"
                        onClick={(e) => beginEdit(e, index, item)}
                      >
                        <img
                          src={assets.edit_icon}
                          alt=""
                        />
                      </button>
                      <button
                        className="icon-btn"
                        aria-label="Delete recent"
                        title="Delete"
                        onClick={(e) => deleteItem(e, index)}
                      >
                        <img
                          src={assets.delete_icon}
                          alt=""
                        />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="bottom">
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt="" />
          {extended ? <p>Help</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt="" />
          {extended ? <p>Activity</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.setting_icon} alt="" />
          {extended ? <p>Settings</p> : null}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
