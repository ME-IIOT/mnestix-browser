﻿import resolutions from '../fixtures/resolutions.json';

describe('Test that the list works together with the comparison view (Resolution 1920 x 1080)', function () {
    before(function () {
        cy.postCompareMockData();

        cy.setResolution(resolutions[0]);
        cy.visit('/list');
    });
    it('should redirect to the comparison page and display the submodel data correctly', function () {
        cy.get('[data-testid="list-row-https://i40.xitaso.com/aas/testElement_1"]')
            .findByTestId('list-checkbox')
            .click();
        cy.get('[data-testid="list-row-https://i40.xitaso.com/aas/testElement_2"]')
            .findByTestId('list-checkbox')
            .click();

        cy.getByTestId('compare-button').click();
        cy.wait(100);
        cy.url().should('contain', '/compare');

        // assert that second aas is displayed correctly
        cy.getByTestId('compare-aas-1').should('be.visible');
        cy.getByTestId('compare-Data-0').click();
        cy.getByTestId('compare-value-1').eq(1).contains('TEST_DATA2');
        cy.getByTestId('compare-value-0').eq(10).should('be.empty');
        cy.getByTestId('compare-value-1').eq(10).contains('2022-01-01');

        // get first collection and assert correct values
        cy.getByTestId('submodel-dropdown-button').first().click();
        cy.getByTestId('compare-value-0').eq(5).contains('de');
        cy.getByTestId('compare-value-1').eq(5).should('be.empty');
        cy.getByTestId('compare-value-0').eq(7).contains('Musterstadt');
        cy.getByTestId('compare-value-1').eq(7).should('be.empty');
        cy.getByTestId('compare-value-1').eq(8).contains('ABC Company');
    });

    after(function () {
        cy.deleteCompareMockData();
    });
});
