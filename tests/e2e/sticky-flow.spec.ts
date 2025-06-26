import { test, expect } from '@playwright/test'

test.describe('Sticky Note Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should create, edit, move and delete sticky note', async ({ page }) => {
    // Create a sticky note by double-clicking on the board
    const boardCanvas = page.getByTestId('board-canvas')
    await boardCanvas.dblclick({ position: { x: 200, y: 200 } })

    // Verify sticky note is created
    const stickyNote = page.getByTestId('sticky-note')
    await expect(stickyNote).toBeVisible()

    // Type text into the sticky note
    const textarea = stickyNote.locator('textarea')
    await textarea.fill('My first sticky note')
    await expect(textarea).toHaveValue('My first sticky note')

    // Drag the sticky note to a new position
    await stickyNote.dragTo(boardCanvas, {
      targetPosition: { x: 400, y: 300 }
    })

    // Create another sticky note
    await boardCanvas.dblclick({ position: { x: 300, y: 100 } })
    const stickyNotes = page.getByTestId('sticky-note')
    await expect(stickyNotes).toHaveCount(2)

    // Delete the first sticky note by dragging to trash
    const trashZone = page.getByTestId('trash-zone')
    await stickyNote.first().dragTo(trashZone)
    
    // Verify only one sticky note remains
    await expect(stickyNotes).toHaveCount(1)

    // Reload the page and verify persistence
    await page.reload()
    await expect(page.getByTestId('sticky-note')).toHaveCount(1)
  })

  test('should zoom and pan the board', async ({ page }) => {
    // Create a sticky note
    const boardCanvas = page.getByTestId('board-canvas')
    await boardCanvas.dblclick({ position: { x: 200, y: 200 } })

    // Zoom in using button
    const zoomInButton = page.getByRole('button', { name: '+' })
    await zoomInButton.click()
    
    // Verify zoom applied (check transform style)
    await expect(boardCanvas).toHaveAttribute('style', /scale\(1\.2\)/)

    // Zoom out
    const zoomOutButton = page.getByRole('button', { name: '-' })
    await zoomOutButton.click()
    

    // Pan the board (shift + drag)
    await page.keyboard.down('Shift')
    await page.mouse.move(200, 200)
    await page.mouse.down()
    await page.mouse.move(300, 300)
    await page.mouse.up()
    await page.keyboard.up('Shift')
  })
})