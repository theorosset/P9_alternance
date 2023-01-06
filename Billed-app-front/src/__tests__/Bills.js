/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Store from "../app/Store.js";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  
  describe("When I am on Bills Page", () => {

    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  // page loading test
  it('Should have loading text on page', () => {
    document.body.innerHTML = BillsUI({ data: [], loading: true })
    expect(screen.getAllByText('Loading...')).toBeTruthy()
  })
  // error message test
  it('Should have error message if can\'t get tickets', () => {
    document.body.innerHTML = BillsUI({ error: 'Fail' })
    expect(screen.getAllByTestId('error-message')).toBeTruthy()
  })

  describe('When I click on icon eye', () => {
    it('Should open bill modal', () => {
      document.body.innerHTML = BillsUI({ data: bills })
      $.fn.modal = jest.fn()

      const navigate = (pathName) => {
        document.body.innerHTML = ROUTES({ pathName })
      }
      
      new Bills({ document, navigate, Store, localStorage: window.localStorage })
      userEvent.click(document.querySelector(`div[data-testid="icon-eye"]`))
      const billUrl = document.querySelector(`div[data-testid="icon-eye"]`).getAttribute('data-bill-url')
      const modale = document.getElementById('modaleFile')
      expect(modale).toBeTruthy()
      expect(modale.innerHTML.includes(billUrl)).toBeTruthy()
    })
  })
})
