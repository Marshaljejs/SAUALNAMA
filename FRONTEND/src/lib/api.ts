const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export const register = async (username: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const login = async (username: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const updateProfile = async (fields: { username?: string; avatar?: string }) => {
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  const res = await fetch(`${API_URL}/auth/password`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const fetchSurveys = async () => {
  const res = await fetch(`${API_URL}/surveys`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchMySurveys = async () => {
  const res = await fetch(`${API_URL}/surveys/my`, { headers: authHeaders() });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchSurvey = async (id: string) => {
  const res = await fetch(`${API_URL}/surveys/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const createSurvey = async (survey: object) => {
  const res = await fetch(`${API_URL}/surveys`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(survey),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const updateSurvey = async (id: string, survey: object) => {
  const res = await fetch(`${API_URL}/surveys/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(survey),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const deleteSurvey = async (id: string) => {
  const res = await fetch(`${API_URL}/surveys/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const submitResponse = async (
  surveyId: string,
  answers: Record<string, string | string[] | number>
) => {
  const res = await fetch(`${API_URL}/responses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      surveyId,
      answers,
      sessionId: crypto.randomUUID(),
      _hp: "", 
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const fetchStats = async (surveyId: string) => {
  const res = await fetch(`${API_URL}/responses/stats/${surveyId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};
export const fetchUserStats = async (userId: number) => {
  const res = await fetch(`${API_URL}/gamification/user/${userId}/stats`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchAchievements = async () => {
  const res = await fetch(`${API_URL}/gamification/achievements`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchComments = async (surveyId: string) => {
  const res = await fetch(`${API_URL}/gamification/comments/${surveyId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const postComment = async (surveyId: string, content: string) => {
  const res = await fetch(`${API_URL}/gamification/comments/${surveyId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const deleteComment = async (commentId: number) => {
  const res = await fetch(`${API_URL}/gamification/comments/item/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const fetchNotifications = async () => {
  const res = await fetch(`${API_URL}/gamification/notifications`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const markAllNotificationsRead = async () => {
  const res = await fetch(`${API_URL}/gamification/notifications/read-all`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const fetchAdminStats = async () => {
  const res = await fetch(`${API_URL}/admin/stats`, { headers: authHeaders() });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchAdminUsers = async () => {
  const res = await fetch(`${API_URL}/admin/users`, { headers: authHeaders() });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchAdminSurveys = async () => {
  const res = await fetch(`${API_URL}/admin/surveys`, { headers: authHeaders() });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateUserRole = async (userId: number, role: string) => {
  const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const banUser = async (userId: number, is_banned: boolean) => {
  const res = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ is_banned }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const adminDeleteUser = async (userId: number) => {
  const res = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const adminDeleteSurvey = async (surveyId: string) => {
  const res = await fetch(`${API_URL}/admin/surveys/${surveyId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const toggleSurveyPublish = async (surveyId: string, is_published: boolean) => {
  const res = await fetch(`${API_URL}/admin/surveys/${surveyId}/publish`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ is_published }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};
