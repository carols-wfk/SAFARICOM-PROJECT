// =====================================================
// Safaricom SME Hub - simple version
// Sections: 1 Helpers, 2 Data, 3 Tabs, 4 Show on screen,
//           5 Actions, 6 Forms, 7 Login
// =====================================================


// ---------- 1. HELPERS (small tools used everywhere) ----------

// Find an element on the page by its id
function get(id) {
  return document.getElementById(id);
}

// Random whole number between min and max
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Show money like "KSh 4,500"
function money(amount) {
  return "KSh " + amount.toLocaleString();
}

// Add a zero in front of small numbers: 5 becomes "05"
function pad(n) {
  if (n < 10) {
    return "0" + n;
  }
  return "" + n;
}

// Turn a date into text like "2026-11-17"
function dateKey(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

// A simple readable date and time like "17 Nov 14:30"
function showDate(date) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return date.getDate() + " " + months[date.getMonth()] + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

// Make user text safe before putting it into the page
function safe(text) {
  text = String(text);
  text = text.replace(/&/g, "&amp;");
  text = text.replace(/</g, "&lt;");
  text = text.replace(/>/g, "&gt;");
  return text;
}

// Fake M-Pesa code like "SAB12CD3E"
function randomCode() {
  return "S" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// Fake phone number like "0712345678"
function randomPhone() {
  var number = "07";
  for (var i = 0; i < 8; i++) {
    number = number + randomNumber(0, 9);
  }
  return number;
}

// Write a message under a form. type is "ok" or "err"
function showMessage(id, text, type) {
  get(id).textContent = text;
  get(id).className = "msg " + type;
}

// Pop-up message at the bottom of the screen for 3 seconds
var toastTimer;
function toast(text) {
  var box = get("toast");
  box.textContent = text;
  box.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    box.classList.remove("show");
  }, 3000);
}


// ---------- 2. DATA (our little "database") ----------

var names = ["Wanjiku M.", "Otieno K.", "Fatuma A.", "Kamau J.", "Achieng O.", "Mutua S.", "Njeri W.", "Kiprop D."];
var transactions = [];
var currentTill = "523419";
var nextInvoice = 1004;
var nextTicket = 1002;

// Date n days from today (negative = in the past)
function daysFromToday(n) {
  var d = new Date();
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

var invoices = [
  { no: "INV-1001", name: "Otieno K.", phone: "0712345678", amount: 4500, due: daysFromToday(5), status: "Pending" },
  { no: "INV-1002", name: "Fatuma A.", phone: "0722334455", amount: 1200, due: daysFromToday(-3), status: "Pending" },
  { no: "INV-1003", name: "Kamau J.", phone: "0733445566", amount: 8000, due: daysFromToday(-10), status: "Paid" }
];

var tickets = [
  { no: "TK-1001", topic: "Till or Paybill", subject: "Till not receiving payments", status: "Open" }
];

// Create 22 random payments over the last 7 days
for (var i = 0; i < 22; i++) {
  var when = new Date();
  when.setDate(when.getDate() - randomNumber(0, 6));
  when.setHours(randomNumber(7, 20), randomNumber(0, 59));
  transactions.push({
    code: randomCode(),
    date: when,
    name: names[randomNumber(0, 7)],
    phone: randomPhone(),
    amount: randomNumber(2, 100) * 50
  });
}

// An invoice is "Overdue" if it is Pending and the due date has passed
function invoiceStatus(invoice) {
  if (invoice.status === "Pending" && invoice.due < dateKey(new Date())) {
    return "Overdue";
  }
  return invoice.status;
}

// Totals for each of the last 7 days (oldest first)
function lastSevenDays() {
  var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var days = [];
  for (var back = 6; back >= 0; back--) {
    var d = new Date();
    d.setDate(d.getDate() - back);
    var key = dateKey(d);
    var count = 0;
    var total = 0;
    for (var j = 0; j < transactions.length; j++) {
      if (dateKey(transactions[j].date) === key) {
        count = count + 1;
        total = total + transactions[j].amount;
      }
    }
    days.push({ key: key, label: dayNames[d.getDay()], count: count, total: total });
  }
  return days;
}


// ---------- 3. TABS (switching between pages) ----------

function showTab(name) {
  var buttons = document.querySelectorAll("#tabs button");
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].getAttribute("data-t") === name) {
      buttons[i].classList.add("on");
    } else {
      buttons[i].classList.remove("on");
    }
  }
  var sections = document.querySelectorAll("section");
  for (var j = 0; j < sections.length; j++) {
    if (sections[j].id === name) {
      sections[j].classList.add("on");
    } else {
      sections[j].classList.remove("on");
    }
  }
}

var tabButtons = document.querySelectorAll("#tabs button");
for (var t = 0; t < tabButtons.length; t++) {
  tabButtons[t].onclick = function () {
    showTab(this.getAttribute("data-t"));
  };
}


// ---------- 4. SHOW THINGS ON SCREEN ----------
// Each function builds some HTML from the data and puts it in the page.

function showDashboard() {
  var days = lastSevenDays();
  var today = days[6];

  var weekTotal = 0;
  var biggest = 1;
  for (var i = 0; i < days.length; i++) {
    weekTotal = weekTotal + days[i].total;
    if (days[i].total > biggest) {
      biggest = days[i].total;
    }
  }

  var unpaid = 0;
  for (var j = 0; j < invoices.length; j++) {
    if (invoices[j].status === "Pending") {
      unpaid = unpaid + invoices[j].amount;
    }
  }

  get("stats").innerHTML =
    '<div class="stat"><b>' + money(today.total) + "</b>Sales today</div>" +
    '<div class="stat"><b>' + today.count + "</b>Payments today</div>" +
    '<div class="stat"><b>' + money(weekTotal) + "</b>Sales this week</div>" +
    '<div class="stat"><b>' + money(unpaid) + "</b>Unpaid invoices</div>";

  var bars = "";
  for (var k = 0; k < days.length; k++) {
    var height = Math.round((days[k].total / biggest) * 120);
    bars = bars + '<div class="col"><i style="height:' + height + 'px"></i>' + days[k].label + "</div>";
  }
  get("chart").innerHTML = bars;
}

function showTransactions() {
  var search = get("q").value.trim().toLowerCase();

  // Newest first
  var sorted = transactions.slice();
  sorted.sort(function (a, b) {
    return b.date - a.date;
  });

  var rows = "";
  for (var i = 0; i < sorted.length && i < 50; i++) {
    var t = sorted[i];
    var match = t.name.toLowerCase().indexOf(search) !== -1 || t.code.toLowerCase().indexOf(search) !== -1;
    if (search === "" || match) {
      rows = rows + "<tr><td>" + showDate(t.date) + "</td><td>" + t.code + "</td><td>" + safe(t.name) +
        "</td><td>" + t.phone + "</td><td><b>" + money(t.amount) + "</b></td></tr>";
    }
  }
  if (rows === "") {
    rows = '<tr><td colspan="5">No transactions match your search.</td></tr>';
  }
  get("txnBody").innerHTML = rows;
}

function showInvoices() {
  var rows = "";
  // Go from the last invoice to the first so the newest is on top
  for (var i = invoices.length - 1; i >= 0; i--) {
    var inv = invoices[i];
    var status = invoiceStatus(inv);
    var actions = "-";
    if (status !== "Paid") {
      actions = '<button class="btn small light" onclick="sendReminder(\'' + inv.no + '\')">SMS reminder</button> ' +
        '<button class="btn small" onclick="markPaid(\'' + inv.no + '\')">Mark paid</button>';
    }
    rows = rows + "<tr><td>" + inv.no + "</td><td>" + safe(inv.name) + "</td><td>" + money(inv.amount) +
      "</td><td>" + inv.due + '</td><td><span class="pill p-' + status + '">' + status + "</span></td><td>" + actions + "</td></tr>";
  }
  get("invBody").innerHTML = rows;
}

function showReport() {
  var days = lastSevenDays();
  var total = 0;
  var count = 0;
  var rows = "";
  // Newest day first
  for (var i = days.length - 1; i >= 0; i--) {
    total = total + days[i].total;
    count = count + days[i].count;
    rows = rows + "<tr><td>" + days[i].key + " (" + days[i].label + ")</td><td>" + days[i].count +
      "</td><td>" + money(days[i].total) + "</td></tr>";
  }
  var average = 0;
  if (count > 0) {
    average = Math.round(total / count);
  }
  get("repSum").innerHTML = "Last 7 days: <b>" + money(total) + "</b> from <b>" + count +
    "</b> payments (average " + money(average) + ").";
  get("repBody").innerHTML = rows;

  // Add up how much each customer has paid
  var totals = {};
  for (var j = 0; j < transactions.length; j++) {
    var name = transactions[j].name;
    if (totals[name] === undefined) {
      totals[name] = 0;
    }
    totals[name] = totals[name] + transactions[j].amount;
  }
  var list = [];
  for (var key in totals) {
    list.push({ name: key, total: totals[key] });
  }
  list.sort(function (a, b) {
    return b.total - a.total;
  });
  var top = "";
  for (var k = 0; k < list.length && k < 3; k++) {
    top = top + "<li>" + safe(list[k].name) + ": " + money(list[k].total) + "</li>";
  }
  get("top").innerHTML = top;
}

function showTickets() {
  var rows = "";
  for (var i = tickets.length - 1; i >= 0; i--) {
    var tk = tickets[i];
    var button = "";
    if (tk.status === "Open") {
      button = '<button class="btn small light" onclick="closeTicket(\'' + tk.no + '\')">Close</button>';
    }
    rows = rows + "<tr><td>" + tk.no + "</td><td>" + safe(tk.topic) + "</td><td>" + safe(tk.subject) +
      '</td><td><span class="pill p-' + tk.status + '">' + tk.status + "</span></td><td>" + button + "</td></tr>";
  }
  get("supBody").innerHTML = rows;
}

// Redraw every page
function showAll() {
  showDashboard();
  showTransactions();
  showInvoices();
  showReport();
  showTickets();
}


// ---------- 5. ACTIONS (things buttons do) ----------

// Find an invoice by its number
function findInvoice(no) {
  for (var i = 0; i < invoices.length; i++) {
    if (invoices[i].no === no) {
      return invoices[i];
    }
  }
}

function sendReminder(no) {
  var inv = findInvoice(no);
  toast("SMS sent to " + inv.phone + ": Dear " + inv.name + ", invoice " + inv.no + " of " +
    money(inv.amount) + " is due on " + inv.due + ". Pay via Till " + currentTill + ".");
}

function markPaid(no) {
  var inv = findInvoice(no);
  inv.status = "Paid";
  transactions.push({
    code: randomCode(),
    date: new Date(),
    name: inv.name,
    phone: inv.phone,
    amount: inv.amount
  });
  showAll();
  toast(inv.no + " marked as paid.");
}

function closeTicket(no) {
  for (var i = 0; i < tickets.length; i++) {
    if (tickets[i].no === no) {
      tickets[i].status = "Closed";
    }
  }
  showTickets();
}

get("simPay").onclick = function () {
  var payment = {
    code: randomCode(),
    date: new Date(),
    name: names[randomNumber(0, 7)],
    phone: randomPhone(),
    amount: randomNumber(2, 60) * 50
  };
  transactions.push(payment);
  showAll();
  toast("Payment received: " + money(payment.amount) + " from " + payment.name + ".");
};

get("q").oninput = showTransactions;

get("csv").onclick = function () {
  var text = "Date,Code,Customer,Phone,Amount\n";
  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    text = text + dateKey(t.date) + "," + t.code + "," + t.name + "," + t.phone + "," + t.amount + "\n";
  }
  var link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  link.download = "sales-report.csv";
  link.click();
};


// ---------- 6. FORMS (check what the user typed) ----------

get("linkForm").onsubmit = function (event) {
  event.preventDefault(); // stop the page from reloading
  var name = get("lbName").value.trim();
  var number = get("lbNum").value.trim();
  var type = get("lbType").value;

  if (name === "") {
    showMessage("linkMsg", "Enter your business name.", "err");
    return;
  }
  // 5 to 7 digits only
  if (!/^[0-9]{5,7}$/.test(number)) {
    showMessage("linkMsg", "A Till or Paybill number has 5 to 7 digits.", "err");
    return;
  }
  currentTill = number;
  get("bizName").textContent = name;
  get("bizPay").textContent = type + " " + number;
  this.reset();
  showMessage("linkMsg", "Account linked successfully.", "ok");
};

get("invForm").onsubmit = function (event) {
  event.preventDefault();
  var name = get("ic").value.trim();
  var phone = get("ip").value.trim();
  var amount = Number(get("ia").value);
  var due = get("id").value;

  if (name === "") {
    showMessage("invMsg", "Enter the customer name.", "err");
    return;
  }
  // Starts with 07 or 01, then 8 more digits
  if (!/^(07|01)[0-9]{8}$/.test(phone)) {
    showMessage("invMsg", "Enter a 10-digit phone number starting with 07 or 01.", "err");
    return;
  }
  if (amount <= 0) {
    showMessage("invMsg", "Enter an amount above 0.", "err");
    return;
  }
  if (due === "" || due < dateKey(new Date())) {
    showMessage("invMsg", "Choose a due date that is today or later.", "err");
    return;
  }

  var no = "INV-" + nextInvoice;
  nextInvoice = nextInvoice + 1;
  invoices.push({ no: no, name: name, phone: phone, amount: amount, due: due, status: "Pending" });
  this.reset();
  showInvoices();
  showDashboard();
  showMessage("invMsg", no + " created. You can now send an SMS reminder.", "ok");
};

get("supForm").onsubmit = function (event) {
  event.preventDefault();
  var subject = get("ss").value.trim();
  var message = get("sm").value.trim();

  if (subject === "" || message.length < 10) {
    showMessage("supMsg", "Add a subject and a message of at least 10 characters.", "err");
    return;
  }
  var no = "TK-" + nextTicket;
  nextTicket = nextTicket + 1;
  tickets.push({ no: no, topic: get("st").value, subject: subject, status: "Open" });
  this.reset();
  showTickets();
  showMessage("supMsg", "Ticket " + no + " submitted. We will reply by SMS.", "ok");
};


// ---------- 7. LOGIN ----------
// NOTE: This is only a classroom demo. Accounts are saved in the browser
// and passwords are stored as plain text. A real app must check passwords
// on a server and never store them as plain text.

function getUsers() {
  var saved = localStorage.getItem("sme_users");
  if (saved === null) {
    return [];
  }
  return JSON.parse(saved);
}

function saveUsers(list) {
  localStorage.setItem("sme_users", JSON.stringify(list));
}

function findUser(email) {
  var list = getUsers();
  for (var i = 0; i < list.length; i++) {
    if (list[i].email === email) {
      return list[i];
    }
  }
  return null;
}

// Make sure the demo account exists
if (findUser("demo@safaricom.demo") === null) {
  var all = getUsers();
  all.push({ email: "demo@safaricom.demo", password: "Demo1234", biz: "Mama Njeri Groceries", till: "523419" });
  saveUsers(all);
}

// Switch between the Sign in and Create account forms
function showAuthForm(isSignUp) {
  get("inForm").hidden = isSignUp;
  get("upForm").hidden = !isSignUp;
  if (isSignUp) {
    get("tabUp").classList.add("on");
    get("tabIn").classList.remove("on");
  } else {
    get("tabIn").classList.add("on");
    get("tabUp").classList.remove("on");
  }
  showMessage("aMsg", "", "");
}

get("tabIn").onclick = function () {
  showAuthForm(false);
};
get("tabUp").onclick = function () {
  showAuthForm(true);
};

// Hide the login screen and show the app
function enterApp(user) {
  currentTill = user.till;
  get("auth").hidden = true;
  get("app").hidden = false;
  get("bizName").textContent = user.biz;
  if (user.till === "") {
    get("bizPay").textContent = "Till not linked yet";
  } else {
    get("bizPay").textContent = "Till " + user.till;
  }
}

get("inForm").onsubmit = function (event) {
  event.preventDefault();
  var email = get("ie").value.trim().toLowerCase();
  var password = get("ipw").value;
  var user = findUser(email);

  if (user === null || user.password !== password) {
    showMessage("aMsg", "Email or password is incorrect.", "err");
    return;
  }
  sessionStorage.setItem("sme_session", email);
  enterApp(user);
};

get("upForm").onsubmit = function (event) {
  event.preventDefault();
  var biz = get("ub").value.trim();
  var email = get("ue").value.trim().toLowerCase();
  var password = get("upw").value;
  var confirm = get("ucf").value;

  if (biz === "") {
    showMessage("aMsg", "Enter your business name.", "err");
    return;
  }
  if (email.indexOf("@") === -1) {
    showMessage("aMsg", "Enter a valid email address.", "err");
    return;
  }
  if (password.length < 6) {
    showMessage("aMsg", "Your password needs at least 6 characters.", "err");
    return;
  }
  if (password !== confirm) {
    showMessage("aMsg", "The two passwords do not match.", "err");
    return;
  }
  if (findUser(email) !== null) {
    showMessage("aMsg", "An account with this email already exists.", "err");
    return;
  }

  var user = { email: email, password: password, biz: biz, till: "" };
  var list = getUsers();
  list.push(user);
  saveUsers(list);
  sessionStorage.setItem("sme_session", email);
  enterApp(user);
  toast("Welcome, " + biz + ". Link your Till on the Dashboard.");
};

get("logout").onclick = function () {
  sessionStorage.removeItem("sme_session");
  get("app").hidden = true;
  get("auth").hidden = false;
  get("inForm").reset();
  get("upForm").reset();
  showAuthForm(false);
  showTab("dash");
};


// ---------- START ----------
showAll();

// If the user is already signed in, skip the login screen
var savedEmail = sessionStorage.getItem("sme_session");
if (savedEmail !== null && findUser(savedEmail) !== null) {
  enterApp(findUser(savedEmail));
}
