import React, { useEffect, useState } from 'react';
import { sendMessage, getMessages } from '../../services/instructorContactApi';
import { getInstructorCourses } from '../../services/instructorCourseApi';
import InstructorNavbar from '../../components/instructor/InstructorNavbar';

const InstructorContactAdmin = () => {
  const [messages, setMessages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    courseId: '',
    priority: 'Normal',
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [msgs, crs] = await Promise.all([getMessages(), getInstructorCourses()]);
        setMessages(msgs);
        setCourses(crs);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Poll for new messages every 5 seconds
    const interval = setInterval(async () => {
        try {
            const msgs = await getMessages();
            setMessages(msgs);
        } catch (err) {
            console.error("Error refreshing messages:", err);
        }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message) return alert('Please enter a message');
    
    setSending(true);
    try {
      const res = await sendMessage({
        courseId: formData.courseId || null,
        priority: formData.priority,
        message: formData.message
      });
      
      if (res.success) {
        alert('Message sent! Token: ' + res.data.token_number);
        setFormData({ courseId: '', priority: 'Normal', message: '' });
        // Refresh messages immediately
        const msgs = await getMessages();
        setMessages(msgs);
      } else {
        alert(res.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Server error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <InstructorNavbar />
      <div className="container mt-4">
        <h2>Contact Admin / Issues</h2>
        
        <div className="row">
          <div className="col-md-5">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Send Message</h5>
              </div>
              <div className="card-body">
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Related Course (Optional)</label>
                    <select className="form-select" name="courseId" value={formData.courseId} onChange={onChange}>
                      <option value="">General Issue</option>
                      {courses.map(c => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Priority</label>
                    <select className="form-select" name="priority" value={formData.priority} onChange={onChange}>
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea 
                      className="form-control" 
                      name="message" 
                      rows="4" 
                      value={formData.message} 
                      onChange={onChange}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={sending}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="card">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">Message History</h5>
              </div>
              <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {loading ? <p>Loading...</p> : messages.length === 0 ? (
                  <p>No messages sent yet.</p>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="card mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="card-subtitle text-muted">
                            {msg.course_id ? msg.course_id.title : 'General'}
                          </h6>
                          <span className={`badge bg-${getPriorityColor(msg.priority)}`}>{msg.priority}</span>
                        </div>
                        <p className="card-text">{msg.message}</p>
                        <div className="text-muted small">
                          {new Date(msg.created_at).toLocaleString()} • Status: <strong>{msg.status}</strong> • Token: {msg.token_number}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Low': return 'info';
    case 'Normal': return 'primary';
    case 'High': return 'warning';
    case 'Urgent': return 'danger';
    default: return 'secondary';
  }
};

export default InstructorContactAdmin;
