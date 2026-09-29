<template>
  <section class="settings-page">
    <article class="settings-card security-card">
      <div class="section-title"><span class="title-icon security"><v-icon icon="mdi-shield-outline" /></span><div><h2>Security Settings</h2><p>Manage your password and security preferences</p></div></div>
      <div class="security-actions">
        <button type="button" @click="openDialog('change')"><span class="action-icon red"><v-icon icon="mdi-lock-outline" /></span><span><strong>Change Password</strong><small>Update your admin passcode</small></span><v-icon class="arrow" icon="mdi-arrow-right" /></button>
        <button type="button" @click="openDialog('reset')"><span class="action-icon orange"><v-icon icon="mdi-key-variant" /></span><span><strong>Reset Password</strong><small>Reset via security question</small></span><v-icon class="arrow" icon="mdi-arrow-right" /></button>
      </div>
      <div class="security-tip"><v-icon icon="mdi-alert-outline" /><div><strong>Security Tip</strong><p>Use a strong passcode with at least 8 characters, including numbers and special characters. Change your password regularly to keep your account secure.</p></div></div>
    </article>

    <article class="settings-card business-card">
      <div class="section-title"><span class="title-icon blue"><v-icon icon="mdi-cog-outline" /></span><div><h2>Business Information</h2><p>Update your business details</p></div></div>
      <form @submit.prevent="saveBusiness"><label>Business Name<input v-model="business.name" /></label><div class="form-grid"><label>Email Address<input v-model="business.email" type="email" /></label><label>Phone Number<input v-model="business.phone" type="tel" /></label></div><button class="save-button" type="submit"><v-icon icon="mdi-content-save-outline" /> Save Changes</button></form>
    </article>

    <article class="settings-card notifications-card">
      <div class="section-title"><span class="title-icon purple"><v-icon icon="mdi-bell-outline" /></span><div><h2>Notification Preferences</h2><p>Choose what notifications you want to receive</p></div></div>
      <label v-for="preference in preferences" :key="preference.name" class="preference"><span class="preference-icon"><v-icon :icon="preference.icon" /></span><span><strong>{{ preference.name }}</strong><small>{{ preference.note }}</small></span><input v-model="preference.enabled" type="checkbox"><i aria-hidden="true" /></label>
    </article>

    <article class="settings-card system-card"><h2>System Information</h2><div class="system-grid"><div v-for="item in systemInfo" :key="item.label"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div></div></article>

    <v-dialog v-model="dialogOpen" max-width="440"><v-card class="settings-dialog"><v-card-title>{{ dialogType === 'change' ? 'Change Password' : 'Reset Password' }}</v-card-title><v-card-text><v-text-field v-if="dialogType === 'change'" label="Current password" type="password" variant="outlined" /><v-text-field label="New password" type="password" variant="outlined" /><v-text-field label="Confirm password" type="password" variant="outlined" /></v-card-text><v-card-actions><v-spacer /><v-btn @click="dialogOpen = false">Cancel</v-btn><v-btn color="primary" variant="flat" @click="savePassword">Save</v-btn></v-card-actions></v-card></v-dialog>
  </section>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  const emit = defineEmits<{ notice: [message: string] }>()
  const dialogOpen = ref(false); const dialogType = ref<'change' | 'reset'>('change')
  const business = reactive({ name: 'TIKBOY LONGGANISA', email: 'admin@tikboy.com', phone: '+63 912 345 6789' })
  const preferences = reactive([{ name: 'Email Notifications', note: 'Receive updates via email', icon: 'mdi-message-outline', enabled: true }, { name: 'SMS Notifications', note: 'Receive urgent alerts via SMS', icon: 'mdi-message-outline', enabled: false }, { name: 'Low Stock Alerts', note: 'Get notified when inventory is low', icon: 'mdi-cube-outline', enabled: true }, { name: 'New Order Notifications', note: 'Alert for each new order', icon: 'mdi-cart-outline', enabled: true }, { name: 'Customer Reviews', note: 'Notify when customers leave reviews', icon: 'mdi-star-outline', enabled: true }])
  const systemInfo = [{ label: 'Dashboard Version', value: 'v2.4.1' }, { label: 'Last Login', value: 'Today, 09:30 AM' }, { label: 'Storage Used', value: '2.4 GB' }]
  const openDialog = (type: 'change' | 'reset') => { dialogType.value = type; dialogOpen.value = true }
  const saveBusiness = () => emit('notice', 'Business information saved')
  const savePassword = () => { dialogOpen.value = false; emit('notice', 'Password updated successfully') }
</script>

<style scoped>
  .settings-page{padding:40px}.settings-card{margin-bottom:30px;padding:40px;border:1px solid #e0e5ec;border-radius:20px;background:#fff;box-shadow:0 2px 3px rgba(11,32,62,.05)}.section-title{display:flex;align-items:center;gap:16px}.title-icon,.action-icon{display:grid;place-items:center;border-radius:16px}.title-icon{width:60px;height:60px;font-size:28px}.security{background:#fee1e4;color:#e3283b}.blue{background:#dceaff;color:#1760eb}.purple{background:#f0e2ff;color:#9628f2}.section-title h2,.system-card h2{margin:0;color:#071d3c;font-size:29px}.section-title p{margin:5px 0 0;color:#4d637f;font-size:17px}.security-actions{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:30px 0}.security-actions button{display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:16px;min-height:128px;padding:24px 30px;border:2px solid #e0e5ec;border-radius:18px;background:#fff;text-align:left}.security-actions button:hover{border-color:#e999a3;background:#fffafb}.action-icon{width:60px;height:60px}.action-icon.red{background:#fce9ed;color:#d72a3d}.action-icon.orange{background:#ffecd2;color:#fc580f}.security-actions strong,.security-actions small,.preference strong,.preference small{display:block}.security-actions strong,.preference strong{color:#071d3c;font-size:20px}.security-actions small,.preference small{margin-top:7px;color:#405a7c;font-size:16px}.arrow{color:#9aa8ba}.security-tip{display:flex;gap:18px;padding:24px;border:1px solid #b5d5ff;border-radius:16px;background:#eef6ff;color:#064ce5}.security-tip p{margin:8px 0 0;font-size:16px}.security-tip strong{font-size:17px}.business-card form{margin-top:32px}.business-card label{display:block;color:#183455;font-size:16px;font-weight:700}.business-card input{display:block;width:100%;height:48px;margin-top:10px;padding:0 16px;border:0;border-radius:10px;background:#f3f4f6;color:#0d2442;font:inherit}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:25px}.save-button{display:flex;align-items:center;gap:13px;margin-top:25px;height:46px;padding:0 18px;border:0;border-radius:10px;background:#df3043;color:white;font-weight:700}.preference{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:18px;min-height:96px;margin-top:20px;padding:20px;border:1px solid #e0e5ec;border-radius:17px}.preference-icon{color:#506078}.preference input{position:absolute;opacity:0}.preference>i{position:relative;width:25px;height:25px;border:2px solid #6f7b8c;border-radius:3px}.preference input:checked+i{border-color:#9dccff;background:#9dccff}.preference input:checked+i::after{content:'✓';position:absolute;left:3px;top:-5px;color:#17334f;font-size:23px;font-style:normal;font-weight:800}.system-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:30px}.system-grid div{padding:28px;border-radius:16px;background:#fafbfc}.system-grid span,.system-grid strong{display:block}.system-grid span{color:#536a87;font-size:16px}.system-grid strong{margin-top:12px;color:#071d3c;font-size:26px}.settings-dialog{border-radius:16px}@media(max-width:900px){.settings-page{padding:28px}.security-actions,.form-grid,.system-grid{grid-template-columns:1fr}}@media(max-width:540px){.settings-page{padding:18px 15px}.settings-card{padding:25px 20px}.section-title h2,.system-card h2{font-size:24px}.security-actions button{padding:20px}.security-tip{padding:18px}.preference{grid-template-columns:30px 1fr auto;padding:18px 14px}}
</style>
