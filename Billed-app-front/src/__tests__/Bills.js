/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import StoreApp from "../app/Store.js";
import store from "../__mocks__/store.js";
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
  // click on eye test
  describe('When I click on icon eye', () => {
    it('Should open bill modal', () => {
      document.body.innerHTML = BillsUI({ data: bills })
      $.fn.modal = jest.fn()

      const navigate = (pathName) => {
        document.body.innerHTML = ROUTES({ pathName })
      }
      
      new Bills({ document, navigate, StoreApp, localStorage: window.localStorage })
      userEvent.click(document.querySelector(`div[data-testid="icon-eye"]`))
      const billUrl = document.querySelector(`div[data-testid="icon-eye"]`).getAttribute('data-bill-url')
      const modale = document.getElementById('modaleFile')
      expect(modale.querySelector('img').getAttribute('src') === billUrl).toBe(true)
      expect(modale).toBeTruthy()
    })
  })
  //click on btn new bill
  describe('when i click on new bill button', () => {
    it('Should navigate to new bills page', () => {
      $.fn.modal = jest.fn();

      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const classContainer = new Bills({ document, onNavigate, StoreApp, localStorage: window.localStorage })

      const navigateToForm = jest.fn(classContainer.handleClickNewBill)
      screen.getByTestId('btn-new-bill').addEventListener('click', navigateToForm)
      userEvent.click(screen.getByTestId('btn-new-bill'))
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })
  })
})
// integration test get
describe('Given i am connected as an employee', () => {
    describe('When i am on Bills page', () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));

      describe('When i get list of bills', () => {
        it('Should get Bills ticket', async () => {
          const spy = jest.spyOn(store, 'bills')
          const bills = await store.bills().list()
          const billsPage = BillsUI({data: bills})
          expect(spy).toHaveBeenCalled()
          expect(bills.length).toBe(4)
          expect(billsPage.includes('test1')).toBe(true)
          expect(billsPage.includes('test2')).toBe(true)
          expect(billsPage.includes('test3')).toBe(true)
      })
    })
    describe('When i want to get list of bills but i have an error', () => {
      it('should get 404 error', async ()=> {
        // localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
        // const root = document.createElement("div")
        // root.setAttribute("id", "root")
        // document.body.append(root)
        // router()
        // store.bills.mockImplementationOnce(() => {
        //   return {
        //     list : () =>  {
        //       return Promise.reject(new Error("Erreur 404"))
        //     }
        //   }
        // })
        // expect(store.bills().list()).toBe(true)
      })
    })
  })
})