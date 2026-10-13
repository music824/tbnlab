(() => {
  'use strict';
  const assetBase = new URL('contact/', document.currentScript.src);
  const channels = {
    wechat: { title: '联系金老师', intro: '项目合作 · 资源对接 · 商务洽谈', image: 'wechat.jpeg', alt: '金老师个人微信联系二维码', note: '微信扫码，或长按二维码识别，添加金老师。' },
    douyin: { title: '抖音 · 官方作品集', intro: 'TBN的金老师 / 项目现场与行业内容', image: 'douyin.png', alt: 'TBN的金老师抖音频道二维码', note: '打开抖音扫一扫，查看官方视频作品。' },
    channels: { title: '视频号 · 官方作品集', intro: 'TBN实验室 / 项目记录与内容分享', image: 'channels.jpg', alt: 'TBN实验室视频号频道二维码', note: '微信扫码，或长按二维码识别，查看视频号作品。' }
  };
  let dialog, lastOpener, previousOverflow;
  function createDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'tbn-contact-dialog';
    dialog.setAttribute('aria-labelledby', 'tbn-contact-title');
    dialog.setAttribute('aria-describedby', 'tbn-contact-intro');
    dialog.innerHTML = `<button class="tbn-contact-close" type="button" aria-label="关闭二维码窗口">×</button>
      <p class="tbn-contact-kicker">TBN LAB / CONNECT</p>
      <h2 class="tbn-contact-title" id="tbn-contact-title"></h2>
      <p class="tbn-contact-intro" id="tbn-contact-intro"></p>
      <div class="tbn-contact-tabs" role="tablist" aria-label="联系与官方作品频道">
        <button id="tbn-contact-tab-wechat" type="button" role="tab" data-channel="wechat" aria-controls="tbn-contact-code">微信洽谈</button>
        <button id="tbn-contact-tab-douyin" type="button" role="tab" data-channel="douyin" aria-controls="tbn-contact-code">抖音作品</button>
        <button id="tbn-contact-tab-channels" type="button" role="tab" data-channel="channels" aria-controls="tbn-contact-code">视频号作品</button>
      </div>
      <div class="tbn-contact-code" id="tbn-contact-code" role="tabpanel">
        <div class="tbn-qr-frame"><img alt="" width="430" height="430" decoding="async"></div>
        <p class="tbn-contact-note" aria-live="polite"></p>
      </div>`;
    document.body.append(dialog);
    dialog.querySelector('.tbn-contact-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; lastOpener?.focus({ preventScroll: true }); });
    const tabs = [...dialog.querySelectorAll('[role="tab"]')];
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab.dataset.channel));
      tab.addEventListener('keydown', event => {
        const destinations = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
        if (!(event.key in destinations)) return;
        event.preventDefault();
        const next = tabs[destinations[event.key]];
        select(next.dataset.channel);
        next.focus();
      });
    });
  }
  function select(channel) {
    const key = channels[channel] ? channel : 'wechat';
    const data = channels[key];
    dialog.querySelector('.tbn-contact-title').textContent = data.title;
    dialog.querySelector('.tbn-contact-intro').textContent = data.intro;
    dialog.querySelector('.tbn-contact-note').textContent = data.note;
    const frame = dialog.querySelector('.tbn-qr-frame');
    frame.dataset.channel = key;
    const image = frame.querySelector('img');
    image.src = new URL(data.image, assetBase).href;
    image.alt = data.alt;
    image.removeAttribute('height');
    dialog.querySelector('[role="tabpanel"]').setAttribute('aria-labelledby', `tbn-contact-tab-${key}`);
    dialog.querySelectorAll('[role="tab"]').forEach(tab => {
      const active = tab.dataset.channel === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }
  document.addEventListener('click', event => {
    const opener = event.target.closest('[data-contact]');
    if (!opener || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!dialog) createDialog();
    lastOpener = opener;
    select(opener.dataset.contact);
    if (!dialog.open) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
  });
  if (document.body.dataset.contactPage === 'true') {
    const requested = new URLSearchParams(location.search).get('channel');
    if (requested === 'douyin' || requested === 'channels') {
      createDialog();
      select(requested);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
  }
})();
