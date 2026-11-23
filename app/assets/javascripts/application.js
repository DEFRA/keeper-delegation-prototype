//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/adding-css-javascript-and-images/
//

window.GOVUKPrototypeKit.documentReady(() => {
  // Filter long lists of holdings as you type (see includes/filter.html)
  document.querySelectorAll('[data-app-filter]').forEach(filter => {
    const input = filter.querySelector('input[type="search"]')
    const count = filter.querySelector('.app-filter__count')
    const list = document.querySelector(filter.dataset.appFilterTarget)
    if (!input || !list) return
    const items = Array.from(list.querySelectorAll(filter.dataset.appFilterItems))

    const update = () => {
      const query = input.value.trim().toLowerCase()
      let shown = 0
      items.forEach(item => {
        const match = !query || item.textContent.toLowerCase().includes(query)
        item.classList.toggle('app-filter-hidden', !match)
        if (match) shown++
      })
      count.textContent = query ? `Showing ${shown} of ${items.length}` : ''
    }
    input.addEventListener('input', update)

    // Stop Enter in the filter box from submitting the form
    input.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault() })

    filter.querySelectorAll('[data-app-select]').forEach(button => {
      button.addEventListener('click', () => {
        const checked = button.dataset.appSelect === 'all'
        items
          .filter(item => !item.classList.contains('app-filter-hidden'))
          .forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]')
            if (checkbox) checkbox.checked = checked
          })
      })
    })
  })
})
