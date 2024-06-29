import React, { useState, useEffect, useRef } from 'react';
import '../styles/LeftSidebar.css';
import { usePagesContext } from '../hooks/usePagesContext';
import { NavLink, useNavigate } from 'react-router-dom';

// components
import ContextMenu from './ContextMenu';
import DeletePageButton from './DeletePageButton';

// Sidebar to LMNT, displays list of pages, create page option, logo, etc
// TODO: Make collapsible and adjustable
const LeftSidebar = () => {
  const { pages, dispatch } = usePagesContext();
  const [contextMenu, setContextMenu] = useState({
    position: {
        x: 0,
        y: 0,
    },
    toggled: false,
    page: null
  });
  const [editMode, setEditMode] = useState(null); // State to track edit mode
  const [editTitle, setEditTitle] = useState(''); // State to track the input value
  const inputRef = useRef(null); // Ref to access the input element
  const [newMode, setNewMode] = useState(null);
  const [newPageParentID, setNewPageParentID] = useState(null);
  const [children, setChildren] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = () => setContextMenu({
        position: {
            x: contextMenu.position.x,
            y: contextMenu.position.y,
        },
        toggled: false,
        page: null
    });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu.position.x, contextMenu.position.y]);

  // Trigger context menu on right click
  const handleRightClick = (e, page) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    setContextMenu({
        position: {
            x,
            y,
        },
        toggled: true,
        page: page
    });
  };

  const resetNewMode = () => {
    setNewMode(false);
  }

  // Creates new page with current page as parent
  const handleCreatePageClick = async (page) => {
    // Route to CreatePage
    // Save parent id
    setNewMode(true);
    setNewPageParentID(page._id);
    navigate('/page/new', { state: { parentId: page._id } });
  };

  // Changes to input, closes cm, and focuses input field when 'Rename Page' in context menu selected
  const handleRenameClick = (page) => {
    setEditMode(page._id);
    setEditTitle(page.title);
    setContextMenu({ ...contextMenu, toggled: false });
    setTimeout(() => {
      inputRef.current && inputRef.current.focus();
    }, 0);
  };

  // Causes the blur and submit to happen at same time
  const handleRenameSubmit = async (e) => {
    if (e.key === 'Enter') {
      inputRef.current && inputRef.current.blur(); // Trigger blur on Enter key
    }
  };

  // Submits the rename to db and updates file, leaving input mode
  const handleBlur = async () => {
    try {
      const response = await fetch('/pages/' + editMode, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: editTitle })
      });

      if (!response.ok) {
        const errorJson = await response.json();
        console.error('Error updating page:', errorJson);
        return;
      }

      const updatedPage = await response.json();
      dispatch({ type: 'UPDATE_PAGE', payload: updatedPage });
      setEditMode(null);
      setEditTitle('');
    } catch (err) {
      console.error('Failed to update page:', err);
    }
  };

  return (
    <div className="sidebar-container">
        {/* LMNT Logo */}
        <div className="logo">
            <NavLink to={'/page/home'} className="text">LMNT</NavLink>
        </div>
        <NavLink className="create-page-button sidebar-item" to={'/page/new'}>Create Page</NavLink>
        
        {/* Lists the pages in db */}
        {pages && pages.map((page) => (
          <div key={page._id} className="sidebar-item" onContextMenu={(e) => handleRightClick(e, page)}>
            {/* If renaming, display input, otherwise link to page */}
            {editMode === page._id ? (
              <input
                ref={inputRef} // Attach the ref to the input
                className="rename-input"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleRenameSubmit}
                onBlur={handleBlur}
                autoFocus
              />
            ) : (
              <NavLink className="page-link" to={'/page/' + page._id}>
                {page.title}
              </NavLink>
            )}
            {/* If creating new file, link to new page */}
            {/* {newMode && newPageParentID === page._id &&
              <NavLink className="page-link" to={'/page/new'}>
                New Page
              </NavLink>
            } */}
          </div>
        ))}

        {/* Context menu details */}
        {contextMenu.toggled && (
          <ContextMenu 
            isVisible={contextMenu.toggled}
            position={contextMenu.position}
            page={contextMenu.page}
          >
            {/* Create new page */} 
            <button className="context-menu-button" onClick={() => handleCreatePageClick(contextMenu.page)}>New Subpage</button> 
            {/* Rename current page */}
            <button className="context-menu-button" onClick={() => handleRenameClick(contextMenu.page)}>Rename Page</button>
            {/* Delete current page */}
            <DeletePageButton page={contextMenu.page} className="context-menu-button">Delete Page</DeletePageButton>
          </ContextMenu>
        )}
    </div>    
  );
};

export default LeftSidebar;
