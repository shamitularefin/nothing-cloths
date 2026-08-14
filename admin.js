import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. PASTE YOUR FIREBASE CONFIG HERE (Same keys you put in script.js)
const firebaseConfig = {
  apiKey: "AIzaSyD2-Cv2r1p1EOLum-Vki6AakC9G8YTtH5A",
  authDomain: "nothing-cloths.firebaseapp.com",
  projectId: "nothing-cloths",
  storageBucket: "nothing-cloths.firebasestorage.app",
  messagingSenderId: "171348520669",
  appId: "1:171348520669:web:f14d53dbe5e38d8c68b534",
  measurementId: "G-XFDHV18673"
};

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ordersList = document.getElementById('orders-list');

// 3. Listen to orders in real-time
const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));

onSnapshot(ordersQuery, (snapshot) => {
    if (snapshot.empty) {
        ordersList.innerHTML = `<tr><td colspan="6">No orders found yet.</td></tr>`;
        return;
    }

    ordersList.innerHTML = "";
    
    snapshot.forEach((docSnapshot) => {
        const order = docSnapshot.data();
        const id = docSnapshot.id;

        const itemsFormatted = (order.items || [])
            .map(i => `• ${i.name} (${i.color}, Size: ${i.size})`)
            .join('<br>');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${order.customerName || 'N/A'}</strong><br>
                <small>${order.phone || ''}</small>
            </td>
            <td>
                ${order.address || ''}<br>
                <small>Method: ${order.paymentMethod || 'COD'}</small>
            </td>
            <td>${itemsFormatted}</td>
            <td><strong>${order.totalPrice || 0} BDT</strong></td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>
                ${order.status === 'Pending' ? `
                    <button class="btn-accept" onclick="updateStatus('${id}', 'Accepted')">Accept</button>
                    <button class="btn-decline" onclick="updateStatus('${id}', 'Declined')">Decline</button>
                ` : `<span>${order.status}</span>`}
            </td>
        `;
        ordersList.appendChild(row);
    });
}, (error) => {
    console.error("Firestore Error: ", error);
    ordersList.innerHTML = `<tr><td colspan="6" style="color:red">Error loading orders. Check Firebase setup.</td></tr>`;
});

// 4. Update status action (Accept / Decline)
window.updateStatus = async (orderId, newStatus) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
        console.error("Error updating order status: ", error);
        alert("Failed to update order status.");
    }
};
