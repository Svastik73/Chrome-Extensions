// Background script for handling alarms and notifications

chrome.runtime.onInstalled.addListener(function() {
  console.log('Goal Reminder Extension installed');
  updateAlarms();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateAlarms') {
    updateAlarms();
  } else if (request.action === 'showTestNotification') {
    showNotification('Test Notification', request.goal);
  }
});

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name.startsWith('goalReminder_')) {
    const goalId = alarm.name.replace('goalReminder_', '');
    showGoalReminder(parseInt(goalId));
  }
});

function updateAlarms() {
  // Clear all existing alarms
  chrome.alarms.clearAll();
  
  // Get goals from storage and create new alarms
  chrome.storage.sync.get(['goals'], function(result) {
    const goals = result.goals || [];
    
    goals.forEach(function(goal) {
      createAlarmForGoal(goal);
    });
  });
}

function createAlarmForGoal(goal) {
  const now = new Date();
  const [hours, minutes] = goal.time.split(':');
  
  // Create alarm for today
  const alarmTime = new Date();
  alarmTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // If the time has already passed today, set for next occurrence
  if (alarmTime <= now) {
    switch(goal.frequency) {
      case 'daily':
        alarmTime.setDate(alarmTime.getDate() + 1);
        break;
      case 'weekly':
        alarmTime.setDate(alarmTime.getDate() + 7);
        break;
      case 'monthly':
        alarmTime.setMonth(alarmTime.getMonth() + 1);
        break;
      case 'yearly':
        alarmTime.setFullYear(alarmTime.getFullYear() + 1);
        break;
    }
  }
  
  const alarmName = `goalReminder_${goal.id}`;
  
  // Set period based on frequency
  let periodInMinutes;
  switch(goal.frequency) {
    case 'daily':
      periodInMinutes = 24 * 60; // 1 day
      break;
    case 'weekly':
      periodInMinutes = 7 * 24 * 60; // 7 days
      break;
    case 'monthly':
      periodInMinutes = 30 * 24 * 60; // ~30 days
      break;
    case 'yearly':
      periodInMinutes = 365 * 24 * 60; // ~365 days
      break;
    default:
      periodInMinutes = 24 * 60;
  }
  
  chrome.alarms.create(alarmName, {
    when: alarmTime.getTime(),
    periodInMinutes: periodInMinutes
  });
  
  console.log(`Created ${goal.frequency} alarm for goal "${goal.text}" at ${goal.time}`);
}

function showGoalReminder(goalId) {
  chrome.storage.sync.get(['goals'], function(result) {
    const goals = result.goals || [];
    const goal = goals.find(g => g.id === goalId);
    
    if (goal) {
      showNotification('🎯 Goal Reminder', goal.text);
    }
  });
}

function showNotification(title, message) {
  const options = {
    type: 'basic',
    iconUrl: 'png48.jpg',
    title: title,
    message: message,
    priority: 1
  };
  
  chrome.notifications.create('', options, function(id) {
    console.log('Notification shown:', id);
  });
  
  // Auto-clear notification after 10 seconds
  setTimeout(() => {
    chrome.notifications.clear(id);
  }, 10000);
}